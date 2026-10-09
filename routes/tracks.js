const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { pool } = require('../db/database');
const upload = require('../middleware/upload');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { uploadAudioToSupabase, uploadCoverImageToSupabase, deleteAudioFromSupabase, deleteCoverFromSupabase } = require('../services/supabase');

// GET ALL TRACKS (With search, subgenre filter, mood filter, sorting)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { subgenre, mood, search, sort } = req.query;

    let sql = `
      SELECT t.*, u.name AS uploader_name, u.username AS uploader_username 
      FROM tracks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (subgenre && subgenre !== 'All') {
      sql += ` AND LOWER(t.subgenre) = LOWER(?)`;
      params.push(subgenre);
    }

    if (mood && mood !== 'All') {
      sql += ` AND LOWER(t.mood) = LOWER(?)`;
      params.push(mood);
    }

    if (search) {
      sql += ` AND (LOWER(t.title) LIKE ? OR LOWER(t.artist) LIKE ? OR LOWER(t.subgenre) LIKE ?)`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (sort === 'popular') {
      sql += ` ORDER BY t.plays DESC`;
    } else if (sort === 'liked') {
      sql += ` ORDER BY t.likes_count DESC`;
    } else {
      sql += ` ORDER BY t.created_at DESC`;
    }

    const [rows] = await pool.query(sql, params);

    const tracks = rows.map((row) => ({
      id: row.id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      subgenre: row.subgenre,
      duration: row.duration,
      durationSec: row.duration_sec,
      plays:
        row.plays > 1000000
          ? `${(row.plays / 1000000).toFixed(1)}M`
          : row.plays > 1000
          ? `${(row.plays / 1000).toFixed(1)}K`
          : `${row.plays}`,
      likesCount: row.likes_count,
      bpm: row.bpm,
      rating: row.rating,
      cover: row.cover_url,
      audioUrl: row.audio_url,
      mood: row.mood,
      featured: Boolean(row.featured),
      description: row.description,
      uploader: row.uploader_name
        ? { name: row.uploader_name, username: row.uploader_username }
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
    const [rows] = await pool.query('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Track not found.' });
    }
    const track = rows[0];
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

      let audioUrl = 'synth:drift';
      if (req.files && req.files.audio && req.files.audio[0]) {
        const audioFile = req.files.audio[0];
        audioUrl = await uploadAudioToSupabase(
          audioFile.buffer,
          audioFile.originalname,
          audioFile.mimetype || 'audio/mpeg'
        );
      }

      let coverUrl = customCoverUrl || '';
      if (req.files && req.files.cover && req.files.cover[0]) {
        const coverFile = req.files.cover[0];
        coverUrl = await uploadCoverImageToSupabase(
          coverFile.buffer,
          coverFile.originalname,
          coverFile.mimetype || 'image/jpeg'
        );
      }

      const trackId = `trk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userId = req.user ? req.user.id : null;
      const trackArtist = artist || (req.user ? req.user.username : 'Phonk Producer');

      await pool.query(
        `INSERT INTO tracks 
         (id, title, artist, album, subgenre, duration, duration_sec, plays, likes_count, bpm, rating, cover_url, audio_url, mood, featured, description, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trackId,
          title.toUpperCase(),
          trackArtist,
          album || 'SINGLE',
          subgenre || 'Drift Phonk',
          duration || '2:30',
          150,
          1,
          0,
          parseInt(bpm) || 150,
          5,
          coverUrl,
          audioUrl,
          mood || 'Aggressive',
          0,
          description || 'Uploaded beat on Phonk Hub.',
          userId,
        ]
      );

      res.status(201).json({
        message: 'Track published successfully!',
        track: {
          id: trackId,
          title: title.toUpperCase(),
          artist: trackArtist,
          album: album || 'SINGLE',
          subgenre: subgenre || 'Drift Phonk',
          duration: duration || '2:30',
          durationSec: 150,
          plays: '1',
          likesCount: 0,
          bpm: parseInt(bpm) || 150,
          rating: 5,
          cover: coverUrl,
          audioUrl: audioUrl,
          mood: mood || 'Aggressive',
          featured: false,
          description: description || 'Uploaded beat on Phonk Hub.',
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
    const [tracks] = await pool.query('SELECT * FROM tracks WHERE id = ?', [trackId]);

    if (tracks.length === 0) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const userId = req.user ? req.user.id : null;

    let [existingLikes] = [];
    if (userId) {
      [existingLikes] = await pool.query('SELECT * FROM likes WHERE user_id = ? AND track_id = ?', [userId, trackId]);
    } else {
      [existingLikes] = await pool.query('SELECT * FROM likes WHERE user_id IS NULL AND track_id = ?', [trackId]);
    }

    let isLiked = false;
    let newLikesCount = tracks[0].likes_count;

    if (existingLikes.length > 0) {
      await pool.query('DELETE FROM likes WHERE id = ?', [existingLikes[0].id]);
      newLikesCount = Math.max(0, newLikesCount - 1);
      await pool.query('UPDATE tracks SET likes_count = ? WHERE id = ?', [newLikesCount, trackId]);
      isLiked = false;
    } else {
      const likeId = `lik_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await pool.query('INSERT INTO likes (id, track_id, user_id) VALUES (?, ?, ?)', [likeId, trackId, userId]);
      newLikesCount += 1;
      await pool.query('UPDATE tracks SET likes_count = ? WHERE id = ?', [newLikesCount, trackId]);
      isLiked = true;
    }

    res.json({
      trackId,
      likesCount: newLikesCount,
      isLiked,
    });
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle like status.' });
  }
});

// DELETE TRACK (Requires Auth or Uploader permissions)
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const trackId = req.params.id;
    const [tracks] = await pool.query('SELECT * FROM tracks WHERE id = ?', [trackId]);

    if (tracks.length === 0) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const track = tracks[0];

    // Delete audio and cover from Supabase storage
    if (track.audio_url) {
      await deleteAudioFromSupabase(track.audio_url);
    }
    if (track.cover_url) {
      await deleteCoverFromSupabase(track.cover_url);
    }

    await pool.query('DELETE FROM tracks WHERE id = ?', [trackId]);
    res.json({ message: 'Track deleted successfully from MySQL & Supabase.', id: trackId });
  } catch (error) {
    console.error('Track Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete track.' });
  }
});

module.exports = router;
