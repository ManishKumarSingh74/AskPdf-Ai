import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB, Document, DocumentChunk, Message } from './db.js';
import { processPdfDocument, queryRagStream } from './rag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, `${path.basename(file.originalname, ext)}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
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

app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

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
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a PDF file to upload.' });
    }

    const oldDocs = await Document.find();
    for (const oldDoc of oldDocs) {
      const oldPath = path.join(uploadsDir, oldDoc.filename);
      if (fs.existsSync(oldPath)) await fs.promises.unlink(oldPath);
    }
    await Document.deleteMany({});
    await DocumentChunk.deleteMany({});
    await Message.deleteMany({});

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const doc = await Document.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      fileUrl,
      fileSize: req.file.size,
      status: 'uploading',
    });

    await processPdfDocument(doc._id, req.file.path);
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
      const oldPath = path.join(uploadsDir, oldDoc.filename);
      if (fs.existsSync(oldPath)) await fs.promises.unlink(oldPath);
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
    await queryRagStream(req.body, res);
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
