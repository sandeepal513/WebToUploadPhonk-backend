const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../db/database');

// INITIALIZE / FETCH GUEST SESSION
router.post('/session', async (req, res) => {
  try {
    let { guestToken, deviceId } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let [rows] = [];
    if (guestToken) {
      [rows] = await pool.query('SELECT * FROM guest_accounts WHERE guest_token = ?', [guestToken]);
    }

    let guestAccount = rows[0] || null;

    if (!guestAccount) {
      guestToken = `guest_${crypto.randomBytes(16).toString('hex')}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const guestName = `Guest Drift #${randomNum}`;
      const guestId = `gst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await pool.query(
        `INSERT INTO guest_accounts (id, guest_token, guest_name, device_id, ip_address)
         VALUES (?, ?, ?, ?, ?)`,
        [guestId, guestToken, guestName, deviceId || null, typeof ipAddress === 'string' ? ipAddress : null]
      );

      guestAccount = {
        id: guestId,
        guest_token: guestToken,
        guest_name: guestName,
      };
    }

    res.json({
      message: 'Guest session synchronized',
      guestAccount: {
        id: guestAccount.id,
        guestToken: guestAccount.guest_token,
        guestName: guestAccount.guest_name,
      },
    });
  } catch (error) {
    console.error('Guest session error:', error);
    res.status(500).json({ error: 'Failed to initialize guest session.' });
  }
});

// UPDATE GUEST PROFILE NAME
router.put('/profile', async (req, res) => {
  try {
    const { guestToken, guestName } = req.body;

    if (!guestToken || !guestName) {
      return res.status(400).json({ error: 'Guest token and new guest name are required.' });
    }

    await pool.query('UPDATE guest_accounts SET guest_name = ? WHERE guest_token = ?', [
      guestName.trim(),
      guestToken,
    ]);

    const [rows] = await pool.query('SELECT * FROM guest_accounts WHERE guest_token = ?', [guestToken]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Guest account not found.' });
    }

    res.json({
      message: 'Guest profile updated',
      guestAccount: {
        id: rows[0].id,
        guestName: rows[0].guest_name,
      },
    });
  } catch (error) {
    console.error('Guest update error:', error);
    res.status(500).json({ error: 'Failed to update guest profile.' });
  }
});

module.exports = router;
