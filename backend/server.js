const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Hoàng Gia API is running', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

const rootDir = path.join(__dirname, '..');
const appFile = path.join(rootDir, 'app_xuong_in_v68 (5).html');

app.get('/', (req, res) => {
  res.sendFile(appFile, (err) => {
    if (err) {
      res.status(404).send('Không tìm thấy file app_xuong_in_v68 (5).html');
    }
  });
});

app.use(express.static(rootDir));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Hoàng Gia backend is running at http://localhost:${PORT}`);
});
