const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hoanggia-demo-secret';

async function canUseDb() {
  const host = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '';
  const dbName = process.env.DB_NAME || 'hoanggia';

  if (!host || host === 'localhost') {
    return false;
  }

  return !!(dbUser && dbName && process.env.DB_PASS !== undefined);
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
}

router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API ready' });
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Thiếu username hoặc password' });
    }

    if (!(await canUseDb())) {
      if (username === 'admin' && password === 'admin') {
        const user = { id: 1, username: 'admin', role: 'admin' };
        return res.json({ token: signToken(user), user });
      }

      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu demo' });
    }

    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

    if (!rows.length) {
      return res.status(401).json({ message: 'User không tồn tại' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash || '');

    if (!match) {
      return res.status(401).json({ message: 'Sai mật khẩu' });
    }

    const safeUser = { id: user.id, username: user.username, role: user.role || 'user' };
    return res.json({ token: signToken(safeUser), user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Thiếu username hoặc password' });
    }

    if (!(await canUseDb())) {
      return res.status(503).json({ message: 'Database chưa được cấu hình. Vui lòng tạo MySQL và cập nhật .env.' });
    }

    const pool = getPool();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );

    return res.status(201).json({ message: 'Tạo tài khoản thành công' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Lỗi tạo tài khoản', error: error.message });
  }
});

router.get('/po', async (req, res) => {
  try {
    if (!(await canUseDb())) {
      return res.json({ data: [], demo: true });
    }

    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM po_input ORDER BY created_at DESC');
    return res.json({ data: rows, demo: false });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi lấy PO', error: error.message });
  }
});

router.post('/po', async (req, res) => {
  try {
    if (!(await canUseDb())) {
      return res.status(503).json({ message: 'Database chưa được cấu hình. Sẽ bật khi MySQL hoàn tất.' });
    }

    const pool = getPool();
    const { so_po, khach_hang, ngay_giao, items = [] } = req.body || {};

    await pool.execute(
      'INSERT INTO po_input (so_po, khach_hang, ngay_giao, items_json) VALUES (?, ?, ?, ?)',
      [so_po, khach_hang, ngay_giao, JSON.stringify(items)]
    );

    return res.status(201).json({ message: 'PO đã lưu' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi lưu PO', error: error.message });
  }
});

router.get('/nvl', async (req, res) => {
  try {
    if (!(await canUseDb())) {
      return res.json({ data: [], demo: true });
    }

    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM nvl_master ORDER BY ten_vat_tu ASC');
    return res.json({ data: rows, demo: false });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi lấy kho NVL', error: error.message });
  }
});

router.get('/lsx', async (req, res) => {
  try {
    if (!(await canUseDb())) {
      return res.json({ data: [], demo: true });
    }

    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM lsx ORDER BY created_at DESC');
    return res.json({ data: rows, demo: false });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi lấy lệnh SX', error: error.message });
  }
});

router.post('/lsx', async (req, res) => {
  try {
    if (!(await canUseDb())) {
      return res.status(503).json({ message: 'Database chưa được cấu hình. Sẽ bật khi MySQL hoàn tất.' });
    }

    const pool = getPool();
    const { ma, ma_hang, ten_sp, so_po, khach, sl_yeu_cau, data = {} } = req.body || {};

    await pool.execute(
      'INSERT INTO lsx (ma, ma_hang, ten_sp, so_po, khach, sl_yeu_cau, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ma, ma_hang, ten_sp, so_po, khach, sl_yeu_cau, JSON.stringify(data)]
    );

    return res.status(201).json({ message: 'Lệnh SX đã lưu' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi lưu lệnh SX', error: error.message });
  }
});

module.exports = router;
