import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/db.js';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import { testsRouter } from './routes/tests.js';
import { reportsRouter } from './routes/reports.js';
import { adminRouter } from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Инициализация базы данных SQLite и посев начальных данных
initDatabase();

// Регистрация маршрутов API
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/tests', testsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);

// Обработка заявок с публичного сайта (форма "Запросить презентацию" и "Контакты")
app.post('/api/contact/demo-request', (req, res) => {
  const { name, tcName, phone, email, message } = req.body;
  console.log(`📩 Новая заявка на презентацию SmartSafety от ${name} (${tcName}), тел: ${phone}, email: ${email}`);
  res.json({
    success: true,
    message: 'Заявка успешно принята. Наш специалист свяжется с вами в течение 15 минут.'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartSafety API Server',
    timestamp: new Date().toISOString()
  });
});

// Раздача скомпилированного фронтенда (SPA)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🛡️ SmartSafety Platform запущена на http://localhost:${PORT}`);
});

