import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import documentRoutes from './routes/documents.js';
import recordRoutes from './routes/records.js';
import timelineRoutes from './routes/timeline.js';
import assistantRoutes from './routes/assistant.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
