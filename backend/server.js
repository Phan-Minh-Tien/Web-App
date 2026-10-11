const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Hoàng Gia API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/env-check', (req, res) => {
  res.json({
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    dbHost: process.env.DB_HOST || 'not-configured'
  });
});

app.use('/api', require('./routes/api'));

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, '..', 'app_xuong_in_v68 (5).html');
  res.sendFile(htmlPath, (err) => {
    if (err) {
      res.status(404).send('Không tìm thấy file app_xuong_in_v68 (5).html');
    }
  });
});

app.use(express.static(path.join(__dirname, '..')));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Hoàng Gia backend running on http://localhost:${PORT}`);
});
