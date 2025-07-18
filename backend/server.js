const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/clips', express.static('clips'));

// Ensure directories exist
const uploadsDir = 'uploads';
const clipsDir = 'clips';
[uploadsDir, clipsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// In-memory storage for video metadata (use database in production)
const videoDatabase = new Map();

// Routes

// Upload video
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }

  const videoId = uuidv4();
  const videoPath = req.file.path;
  
  // Get video metadata using ffmpeg
  ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
      console.error('Error getting video metadata:', err);
      return res.status(500).json({ error: 'Failed to process video' });
    }

    const duration = metadata.format.duration;
    const videoInfo = {
      id: videoId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: videoPath,
      duration: duration,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    videoDatabase.set(videoId, videoInfo);

    res.json({
      videoId,
      filename: req.file.filename,
      duration,
      size: req.file.size,
      message: 'Video uploaded successfully'
    });
  });
});

// Get video info
app.get('/api/video/:id', (req, res) => {
  const { id } = req.params;
  const video = videoDatabase.get(id);
  
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  res.json(video);
});

// Create clip
app.post('/api/clip', (req, res) => {
  const { videoId, startTime, endTime, clipName } = req.body;
  
  if (!videoId || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const video = videoDatabase.get(videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  const clipId = uuidv4();
  const clipFilename = `${clipId}-${clipName || 'clip'}.mp4`;
  const clipPath = path.join(clipsDir, clipFilename);
  
  // Create clip using ffmpeg
  ffmpeg(video.path)
    .seekInput(startTime)
    .duration(endTime - startTime)
    .output(clipPath)
    .on('end', () => {
      // Get clip file size
      const stats = fs.statSync(clipPath);
      const clipInfo = {
        id: clipId,
        filename: clipFilename,
        path: clipPath,
        parentVideoId: videoId,
        startTime,
        endTime,
        duration: endTime - startTime,
        size: stats.size,
        createdAt: new Date().toISOString()
      };
      
      res.json({
        clipId,
        filename: clipFilename,
        duration: endTime - startTime,
        size: stats.size,
        downloadUrl: `/clips/${clipFilename}`,
        message: 'Clip created successfully'
      });
    })
    .on('error', (err) => {
      console.error('Error creating clip:', err);
      res.status(500).json({ error: 'Failed to create clip' });
    })
    .run();
});

// Get all videos
app.get('/api/videos', (req, res) => {
  const videos = Array.from(videoDatabase.values());
  res.json(videos);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload directory: ${path.resolve(uploadsDir)}`);
  console.log(`Clips directory: ${path.resolve(clipsDir)}`);
});

module.exports = app;