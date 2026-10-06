const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Track = require('../models/Track');
const Like = require('../models/Like');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// GET ALL TRACKS (With search, subgenre filter, mood filter, sorting)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { subgenre, mood, search, sort } = req.query;

    const filter = {};

    if (subgenre && subgenre !== 'All') {
      filter.subgenre = { $regex: new RegExp(`^${subgenre}$`, 'i') };
    }

    if (mood && mood !== 'All') {
      filter.mood = { $regex: new RegExp(`^${mood}$`, 'i') };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { artist: searchRegex },
        { subgenre: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { plays: -1 };
    } else if (sort === 'liked') {
      sortOption = { likesCount: -1 };
    }

    const rows = await Track.find(filter)
      .sort(sortOption)
      .populate('userId', 'name username');

    // Format output
    const tracks = rows.map((row) => ({
      id: row._id.toString(),
      title: row.title,
      artist: row.artist,
      album: row.album,
      subgenre: row.subgenre,
      duration: row.duration,
      durationSec: row.durationSec,
      plays:
        row.plays > 1000000
          ? `${(row.plays / 1000000).toFixed(1)}M`
          : row.plays > 1000
          ? `${(row.plays / 1000).toFixed(1)}K`
          : `${row.plays}`,
      likesCount: row.likesCount,
      bpm: row.bpm,
      rating: row.rating,
      cover: row.coverUrl,
      audioUrl: row.audioUrl,
      mood: row.mood,
      featured: row.featured,
      description: row.description,
      uploader: row.userId
        ? { name: row.userId.name, username: row.userId.username }
        : null,
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Failed to fetch tracks.' });
  }
});

// GET SINGLE TRACK BY ID
router.get('/:id', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found.' });
    }
    res.json({ track });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch track.' });
  }
});

// UPLOAD / CREATE NEW TRACK
router.post(
  '/',
  optionalAuth,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, artist, album, subgenre, mood, bpm, duration, description, customCoverUrl } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Track title is required.' });
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      let audioUrl = 'synth:drift';
      if (req.files && req.files.audio && req.files.audio[0]) {
        audioUrl = `${baseUrl}/uploads/audio/${req.files.audio[0].filename}`;
      }

      let coverUrl = '/assets/phonkimg/drift.jpg';
      if (req.files && req.files.cover && req.files.cover[0]) {
        coverUrl = `${baseUrl}/uploads/covers/${req.files.cover[0].filename}`;
      } else if (customCoverUrl) {
        coverUrl = customCoverUrl;
      }

      const userId = req.user ? req.user.id : null;
      const trackArtist = artist || (req.user ? req.user.username : 'Phonk Producer');

      const createdTrack = await Track.create({
        title: title.toUpperCase(),
        artist: trackArtist,
        album: album || 'SINGLE',
        subgenre: subgenre || 'Drift Phonk',
        duration: duration || '2:30',
        durationSec: 150,
        plays: 1,
        likesCount: 0,
        bpm: parseInt(bpm) || 150,
        rating: 5,
        coverUrl: coverUrl,
        audioUrl: audioUrl,
        mood: mood || 'Aggressive',
        featured: false,
        description: description || 'Uploaded beat on Phonk Hub.',
        userId: userId || null,
      });

      res.status(201).json({
        message: 'Track published successfully!',
        track: {
          id: createdTrack._id.toString(),
          title: createdTrack.title,
          artist: createdTrack.artist,
          album: createdTrack.album,
          subgenre: createdTrack.subgenre,
          duration: createdTrack.duration,
          durationSec: createdTrack.durationSec,
          plays: '1',
          likesCount: 0,
          bpm: createdTrack.bpm,
          rating: 5,
          cover: createdTrack.coverUrl,
          audioUrl: createdTrack.audioUrl,
          mood: createdTrack.mood,
          featured: false,
          description: createdTrack.description,
        },
      });
    } catch (error) {
      console.error('Track Upload Error:', error);
      res.status(500).json({ error: 'Failed to upload track.' });
    }
  }
);

// TOGGLE LIKE TRACK
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const trackId = req.params.id;
    const track = await Track.findById(trackId);

    if (!track) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const userId = req.user ? req.user.id : null;
    const guestToken = req.headers['x-guest-token'] || 'guest-user';

    let existingLike = null;
    if (userId) {
      existingLike = await Like.findOne({ userId, trackId });
    } else {
      existingLike = await Like.findOne({ guestAccountId: null, trackId });
    }

    let isLiked = false;
    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      track.likesCount = Math.max(0, track.likesCount - 1);
      await track.save();
      isLiked = false;
    } else {
      await Like.create({
        trackId,
        userId: userId || null,
      });
      track.likesCount += 1;
      await track.save();
      isLiked = true;
    }

    res.json({
      trackId,
      likesCount: track.likesCount,
      isLiked,
    });
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle like status.' });
  }
});

// INCREMENT PLAY COUNTER
router.post('/:id/play', async (req, res) => {
  try {
    const trackId = req.params.id;
    await Track.findByIdAndUpdate(trackId, { $inc: { plays: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record play.' });
  }
});

// AUDIO FILE STREAMING (Supporting HTTP 206 Range headers)
router.get('/:id/stream', async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track || !track.audioUrl || track.audioUrl.startsWith('synth:')) {
      return res.status(400).json({ error: 'Track uses synthetic audio or file not found.' });
    }

    // Extract local filename if stored locally
    const filename = track.audioUrl.split('/uploads/audio/')[1];
    if (!filename) {
      return res.redirect(track.audioUrl);
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found on server.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Audio stream error:', error);
    res.status(500).json({ error: 'Failed to stream audio.' });
  }
});

// DELETE TRACK
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const trackId = req.params.id;
    const track = await Track.findById(trackId);

    if (!track) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    if (track.userId && track.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own uploaded tracks.' });
    }

    await Track.findByIdAndDelete(trackId);
    res.json({ message: 'Track deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete track.' });
  }
});

module.exports = router;
