import React, { useState, useRef, useEffect } from 'react';
import { Upload, Scissors, Download, Play, Pause, RotateCcw } from 'lucide-react';

const VideoClipperApp = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [clipName, setClipName] = useState('');
  const [clips, setClips] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const API_BASE = 'http://localhost:3001/api';

  // Load videos on component mount
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch(`${API_BASE}/videos`);
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert('Video uploaded successfully!');
        loadVideos();
        // Clear the file input
        event.target.value = '';
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setStartTime(0);
    setEndTime(Math.min(30, video.duration)); // Default to 30 seconds or video duration
    setClipName(`${video.originalName}-clip`);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setEndTime(Math.min(30, videoRef.current.duration));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setAsStartTime = () => {
    setStartTime(currentTime);
  };

  const setAsEndTime = () => {
    setEndTime(currentTime);
  };

  const createClip = async () => {
    if (!selectedVideo || startTime >= endTime) {
      alert('Please select valid start and end times');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/clip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideo.id,
          startTime,
          endTime,
          clipName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClips([...clips, data]);
        alert('Clip created successfully!');
      } else {
        const error = await response.json();
        alert(`Clip creation failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Clip creation error:', error);
      alert('Clip creation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Video Clipper
        </h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            Upload Video
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center mx-auto"
            >
              <Upload className="mr-2" size={16} />
              {uploading ? 'Uploading...' : 'Choose Video File'}
            </button>
            
            <p className="text-gray-500 mt-2">
              Supports MP4, AVI, MOV, WMV, MKV (Max 500MB)
            </p>
          </div>
        </div>

        {/* Video List */}
        {videos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Videos</h2>
            <div className="space-y-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedVideo?.id === video.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{video.originalName}</h3>
                      <p className="text-sm text-gray-600">
                        Duration: {formatTime(video.duration)} | Size: {formatFileSize(video.size)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(video.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Player and Clipper */}
        {selectedVideo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Scissors className="mr-2" size={20} />
              Create Clip
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Player */}
              <div>
                <video
                  ref={videoRef}
                  src={`http://localhost:3001/uploads/${selectedVideo.filename}`}
                  className="w-full rounded-lg"
                  controls
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Quick Controls */}
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  <button
                    onClick={() => handleSeek(0)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <RotateCcw size={16} />
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Clip Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clip Name
                  </label>
                  <input
                    type="text"
                    value={clipName}
                    onChange={(e) => setClipName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter clip name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time (seconds)
                    </label>
                    <input
                      type="number"
                      value={startTime}
                      onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                      min="0"
                      max={duration}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={setAsStartTime}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Use current time ({formatTime(currentTime)})
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time (seconds)
                    </label>
                    <input
                      type="number"
                      value={endTime}
                      onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                      min="0"
                      max={duration}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={setAsEndTime}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Use current time ({formatTime(currentTime)})
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Clip duration: {formatTime(Math.max(0, endTime - startTime))}
                </div>

                <button
                  onClick={createClip}
                  disabled={processing || startTime >= endTime}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                >
                  <Scissors className="mr-2" size={16} />
                  {processing ? 'Creating Clip...' : 'Create Clip'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Created Clips */}
        {clips.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Download className="mr-2" size={20} />
              Created Clips
            </h2>
            
            <div className="space-y-4">
              {clips.map((clip) => (
                <div key={clip.clipId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">{clip.filename}</h3>
                    <p className="text-sm text-gray-600">
                      Duration: {formatTime(clip.duration)} | Size: {formatFileSize(clip.size)}
                    </p>
                  </div>
                  <a
                    href={`http://localhost:3001${clip.downloadUrl}`}
                    download
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Download className="mr-2" size={16} />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoClipperApp;