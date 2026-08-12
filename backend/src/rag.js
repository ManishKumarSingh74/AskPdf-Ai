import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';
import { Document, DocumentChunk, Message } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const GENERATION_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'gemini-embedding-001';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY ;
  return new GoogleGenAI({ apiKey });
};

export const generateEmbedding = async (text) => {
  const ai = getGeminiClient();
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });

  if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
    return response.embeddings[0].values;
  }
  if (response.embedding && response.embedding.values) {
    return response.embedding.values;
  }
  throw new Error('Gemini API returned empty vector embedding.');
};

export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
};

export const processPdfDocument = async (documentId, filePath) => {
  const doc = await Document.findById(documentId);
  if (!doc) return;

  try {
    doc.status = 'processing';
    await doc.save();

    const fileBuffer = await fs.promises.readFile(filePath);

    const pages = [];
    await pdfParse(fileBuffer, {
      pagerender: async (pageData) => {
        const pageNumber = pageData.pageNumber || pageData.pageIndex + 1;
        const textContent = await pageData.getTextContent();
        const text = textContent.items.map((i) => i.str).join(' ').trim();
        pages.push({ pageNumber, text });
        return text;
      },
    });

    doc.pageCount = pages.length;
    await doc.save();

    const rawChunks = [];
    let chunkIndex = 0;

    for (const page of pages) {
      if (!page.text) continue;
      const paragraphs = page.text.split(/\n\s*\n/);

      let currentText = '';
      for (const para of paragraphs) {
        const cleanPara = para.replace(/\s+/g, ' ').trim();
        if (!cleanPara) continue;

        if (currentText.length + cleanPara.length > 800 && currentText.length > 0) {
          rawChunks.push({
            content: currentText,
            pageNumber: page.pageNumber,
            chunkIndex: chunkIndex++,
          });

          currentText = currentText.slice(-150) + ' ' + cleanPara;
        } else {
          currentText = currentText ? currentText + ' ' + cleanPara : cleanPara;
        }
      }

      if (currentText.trim().length > 0) {
        rawChunks.push({
          content: currentText.trim(),
          pageNumber: page.pageNumber,
          chunkIndex: chunkIndex++,
        });
      }
    }

    if (rawChunks.length === 0) {
      throw new Error('This PDF contains no extractable text.');
    }

    const BATCH_SIZE = 5;
    const chunksToInsert = [];

    for (let i = 0; i < rawChunks.length; i += BATCH_SIZE) {
      const batch = rawChunks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (chunk) => {
          const vector = await generateEmbedding(chunk.content);
          return { ...chunk, embedding: vector };
        })
      );
      chunksToInsert.push(...batchResults);
    }

    await DocumentChunk.deleteMany({});
    await DocumentChunk.insertMany(chunksToInsert);

    await Message.deleteMany({});

    doc.status = 'ready';
    await doc.save();
    console.log(`[RAG Engine] Processed PDF "${doc.originalName}" into ${chunksToInsert.length} vector chunks.`);
  } catch (error) {
    console.error(`[RAG Engine Error]:`, error.message);
    doc.status = 'failed';
    doc.processingError = error.message;
    await doc.save();
  }
};

export const queryRagStream = async ({ question }, res) => {
  const ai = getGeminiClient();

  await Message.create({ role: 'user', content: question });

  const questionVector = await generateEmbedding(question);

  const chunks = await DocumentChunk.find().lean();

  const scoredChunks = chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(questionVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const sourcesMap = new Map();
  scoredChunks.forEach((c) => {
    if (!sourcesMap.has(c.pageNumber)) {
      sourcesMap.set(c.pageNumber, { pageNumber: c.pageNumber });
    }
  });
  const sources = Array.from(sourcesMap.values());

  let contextBlocks = '';
  scoredChunks.forEach((c, idx) => {
    contextBlocks += `\n[Context Block ${idx + 1} | Page: ${c.pageNumber}]\n${c.content}\n`;
  });

  const systemInstruction = `You are a helpful AI assistant answering questions about the uploaded PDF. 
Answer using ONLY the provided PDF context blocks. If the answer is not in the PDF, say "I could not find this information in the PDF."
Always include the page number citations in your explanation.`;

  const prompt = `${contextBlocks}\n--- User Question ---\n${question}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'metadata', sources })}\n\n`);

  const responseStream = await ai.models.generateContentStream({
    model: GENERATION_MODEL,
    contents: prompt,
    config: { systemInstruction, temperature: 0.2 },
  });

  let fullAnswer = '';
  for await (const chunk of responseStream) {
    const text = chunk.text || '';
    fullAnswer += text;
    res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
  }

  await Message.create({
    role: 'assistant',
    content: fullAnswer,
    sources,
  });

  res.write(`data: ${JSON.stringify({ type: 'done', fullAnswer, sources })}\n\n`);
  res.end();
};
