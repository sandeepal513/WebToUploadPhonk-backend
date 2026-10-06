const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = name || cleanUsername;
    const defaultAvatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`;

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      name: displayName,
      avatar: defaultAvatar,
      bio: '',
    });

    // Create JWT Token
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: user._id.toString(),
        username: `@${user.username}`,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followersCount,
        following: user.followingCount,
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

    const user = await User.findOne({
      $or: [{ username: input }, { email: input }],
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id.toString(),
        username: `@${user.username}`,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followersCount,
        following: user.followingCount,
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
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      user: {
        id: user._id.toString(),
        username: `@${user.username}`,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        followers: user.followersCount,
        following: user.followingCount,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

module.exports = router;
