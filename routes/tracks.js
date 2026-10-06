const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Track = require('../models/Track');
const Like = require('../models/Like');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { uploadAudioToSupabase, uploadCoverImageToSupabase, deleteAudioFromSupabase, deleteCoverFromSupabase } = require('../services/supabase');

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
        const audioFile = req.files.audio[0];
        try {
          audioUrl = await uploadAudioToSupabase(
            audioFile.path,
            audioFile.originalname || audioFile.filename,
            audioFile.mimetype || 'audio/mpeg'
          );
        } catch (supaErr) {
          console.warn('⚠️ Supabase audio upload error, using local url fallback:', supaErr.message);
          audioUrl = `${baseUrl}/uploads/audio/${audioFile.filename}`;
        }
      }

      let coverUrl = '/assets/phonkimg/drift.jpg';
      if (req.files && req.files.cover && req.files.cover[0]) {
        const coverFile = req.files.cover[0];
        try {
          coverUrl = await uploadCoverImageToSupabase(
            coverFile.path,
            coverFile.originalname || coverFile.filename,
            coverFile.mimetype || 'image/jpeg'
          );
        } catch (supaErr) {
          console.warn('⚠️ Supabase cover upload error, using local url fallback:', supaErr.message);
          coverUrl = `${baseUrl}/uploads/covers/${coverFile.filename}`;
        }
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

// EDIT / UPDATE TRACK (Requires Auth or Uploader permissions)
router.put(
  '/:id',
  optionalAuth,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const trackId = req.params.id;
      const track = await Track.findById(trackId);

      if (!track) {
        return res.status(404).json({ error: 'Track not found.' });
      }

      // Check ownership
      const userId = req.user ? req.user.id : null;
      const isOwner =
        (userId && track.userId && track.userId.toString() === userId) ||
        (req.user && (track.artist === req.user.name || track.artist === req.user.username));

      if (!isOwner && track.userId) {
        return res.status(403).json({ error: 'You can only edit your own uploaded tracks.' });
      }

      const { title, artist, album, subgenre, mood, bpm, description, customCoverUrl } = req.body;
      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      if (title) track.title = title.toUpperCase();
      if (artist) track.artist = artist;
      if (album) track.album = album;
      if (subgenre) track.subgenre = subgenre;
      if (mood) track.mood = mood;
      if (bpm) track.bpm = parseInt(bpm) || track.bpm;
      if (description !== undefined) track.description = description;

      // Handle new Audio File upload to Supabase
      if (req.files && req.files.audio && req.files.audio[0]) {
        const audioFile = req.files.audio[0];
        try {
          track.audioUrl = await uploadAudioToSupabase(
            audioFile.path,
            audioFile.originalname || audioFile.filename,
            audioFile.mimetype || 'audio/mpeg'
          );
        } catch (supaErr) {
          console.warn('⚠️ Supabase audio update fallback:', supaErr.message);
          track.audioUrl = `${baseUrl}/uploads/audio/${audioFile.filename}`;
        }
      }

      // Handle new Cover Artwork upload to Supabase
      if (req.files && req.files.cover && req.files.cover[0]) {
        const coverFile = req.files.cover[0];
        try {
          track.coverUrl = await uploadCoverImageToSupabase(
            coverFile.path,
            coverFile.originalname || coverFile.filename,
            coverFile.mimetype || 'image/jpeg'
          );
        } catch (supaErr) {
          console.warn('⚠️ Supabase cover update fallback:', supaErr.message);
          track.coverUrl = `${baseUrl}/uploads/covers/${coverFile.filename}`;
        }
      } else if (customCoverUrl) {
        track.coverUrl = customCoverUrl;
      }

      await track.save();

      res.json({
        message: 'Track updated successfully!',
        track: {
          id: track._id.toString(),
          title: track.title,
          artist: track.artist,
          album: track.album,
          subgenre: track.subgenre,
          duration: track.duration,
          durationSec: track.durationSec,
          plays: `${track.plays}`,
          likesCount: track.likesCount,
          bpm: track.bpm,
          rating: track.rating,
          cover: track.coverUrl,
          audioUrl: track.audioUrl,
          mood: track.mood,
          featured: track.featured,
          description: track.description,
        },
      });
    } catch (error) {
      console.error('Track Update Error:', error);
      res.status(500).json({ error: 'Failed to update track.' });
    }
  }
);

// DELETE TRACK (Requires Auth or Uploader permissions)
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const trackId = req.params.id;
    const track = await Track.findById(trackId);

    if (!track) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const userId = req.user ? req.user.id : null;
    const isOwner =
      (userId && track.userId && track.userId.toString() === userId) ||
      (req.user && (track.artist === req.user.name || track.artist === req.user.username)) ||
      !track.userId; // Allow deleting unassigned or session tracks

    if (!isOwner) {
      return res.status(403).json({ error: 'You can only delete your own uploaded tracks.' });
    }

    // Delete files from Supabase Storage buckets
    if (track.audioUrl) {
      await deleteAudioFromSupabase(track.audioUrl);

      // Delete local audio file if stored locally
      const localFilename = track.audioUrl.split('/uploads/audio/')[1];
      if (localFilename) {
        const localFilePath = path.join(__dirname, '..', 'uploads', 'audio', localFilename);
        if (fs.existsSync(localFilePath)) {
          try { fs.unlinkSync(localFilePath); } catch (e) {}
        }
      }
    }

    if (track.coverUrl) {
      await deleteCoverFromSupabase(track.coverUrl);

      // Delete local cover file if stored locally
      const localCovername = track.coverUrl.split('/uploads/covers/')[1];
      if (localCovername) {
        const localCoverPath = path.join(__dirname, '..', 'uploads', 'covers', localCovername);
        if (fs.existsSync(localCoverPath)) {
          try { fs.unlinkSync(localCoverPath); } catch (e) {}
        }
      }
    }

    await Track.findByIdAndDelete(trackId);
    res.json({ message: 'Track and associated files deleted from Supabase successfully.', id: trackId });
  } catch (error) {
    console.error('Track Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete track.' });
  }
});

module.exports = router;
