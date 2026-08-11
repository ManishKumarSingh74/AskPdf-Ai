import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ATLAS_URI = 'mongodb+srv://manishnode:ejzuRz6lSK48lmyn@manishdb.49xeg.mongodb.net/ai_pdf_assistant';

export const connectDB = async (retries = 3) => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  const uri = process.env.MONGODB_URI || ATLAS_URI;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      console.log(`[MongoDB] Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`[MongoDB] Connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

const DocumentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    pageCount: { type: Number, default: 0 },
    status: { type: String, enum: ['uploading', 'processing', 'ready', 'failed'], default: 'uploading' },
    processingError: { type: String, default: null },
  },
  { timestamps: true }
);

const DocumentChunkSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    pageNumber: { type: Number, required: true },
    chunkIndex: { type: Number, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: [
      {
        pageNumber: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', DocumentSchema);
export const DocumentChunk = mongoose.model('DocumentChunk', DocumentChunkSchema);
export const Message = mongoose.model('Message', MessageSchema);
