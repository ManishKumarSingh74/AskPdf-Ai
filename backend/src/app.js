import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB, Document, DocumentChunk, Message } from './db.js';
import { processPdfDocument, queryRag } from './rag.js';
import { uploadToCloudinary, deleteFromCloudinary } from './cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only single PDF files are allowed!'), false);
    }
  },
});

const app = express();

const allowedOrigins = [
  'https://askpdf-ai-g2x7.onrender.com',
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));

app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: 'Database is reconnecting to MongoDB Atlas. Please retry in a moment.',
      });
    }
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please select a PDF file to upload.' });
    }

    const oldDocs = await Document.find();
    for (const oldDoc of oldDocs) {
      if (oldDoc.publicId) {
        await deleteFromCloudinary(oldDoc.publicId);
      }
    }
    await Document.deleteMany({});
    await DocumentChunk.deleteMany({});
    await Message.deleteMany({});

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const doc = await Document.create({
      originalName: req.file.originalname,
      filename: cloudinaryResult.public_id,
      fileUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      fileSize: req.file.size,
      status: 'uploading',
    });

    await processPdfDocument(doc._id, req.file.buffer);
    const readyDoc = await Document.findById(doc._id);

    if (readyDoc && readyDoc.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: readyDoc.processingError || 'Failed to process PDF document. Please check your Gemini API key and try again.',
        document: readyDoc,
      });
    }

    res.status(201).json({ success: true, document: readyDoc });
  } catch (error) {
    next(error);
  }
});

app.get('/api/document', async (req, res, next) => {
  try {
    const document = await Document.findOne().sort({ createdAt: -1 });
    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/document', async (req, res, next) => {
  try {
    const oldDocs = await Document.find();
    for (const oldDoc of oldDocs) {
      if (oldDoc.publicId) {
        await deleteFromCloudinary(oldDoc.publicId);
      }
    }
    await Document.deleteMany({});
    await DocumentChunk.deleteMany({});
    await Message.deleteMany({});
    res.json({ success: true, message: 'Document deleted.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }
    const result = await queryRag({ question });
    res.json({ success: true, answer: result.answer, sources: result.sources });
  } catch (error) {
    next(error);
  }
});

app.get('/api/messages', async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});

const distPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('[Backend Error]:', err);
  res.status(res.statusCode !== 200 ? res.statusCode : 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
