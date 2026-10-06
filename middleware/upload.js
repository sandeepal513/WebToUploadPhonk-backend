const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define upload directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const audioDir = path.join(uploadsDir, 'audio');
const coversDir = path.join(uploadsDir, 'covers');

[uploadsDir, audioDir, coversDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, audioDir);
    } else if (file.fieldname === 'cover') {
      cb(null, coversDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/flac'];
    if (allowedAudioTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, OGG, M4A, FLAC) are allowed for track upload!'), false);
    }
  } else if (file.fieldname === 'cover') {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (allowedImageTypes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP) are allowed for cover art!'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

module.exports = upload;
