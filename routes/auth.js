const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/database');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// REGISTER USER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists in MySQL
    const [existing] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email is already registered.' });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = name || cleanUsername;
    const defaultAvatar = '';

    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, name, bio, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, cleanUsername, cleanEmail, passwordHash, displayName, '', defaultAvatar]
    );

    // Create JWT Token
    const token = jwt.sign(
      { id: userId, username: cleanUsername, email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: userId,
        username: `@${cleanUsername}`,
        name: displayName,
        email: cleanEmail,
        avatar: defaultAvatar,
        bio: '',
        followers: 0,
        following: 0,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Please provide email/username and password.' });
    }

    const input = emailOrUsername.trim().toLowerCase().replace('@', '');

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [input, input]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: `@${user.username}`,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        avatar: user.avatar || '',
        followers: user.followers_count || 0,
        following: user.following_count || 0,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        username: `@${user.username}`,
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        avatar: user.avatar || '',
        followers: user.followers_count || 0,
        following: user.following_count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

module.exports = router;
