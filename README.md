🎬 Video Clipper
A full-stack web application for creating clips from larger videos with an intuitive timeline interface.
Show Image
✨ Features

📁 Easy Upload: Drag-and-drop interface for video files
🎯 Precise Clipping: Timeline-based selection with frame-accurate control
🎥 Format Support: MP4, AVI, MOV, WMV, MKV files
⚡ Real-time Preview: See your clip selection before processing
💾 Direct Download: Download clips instantly after creation
📱 Responsive Design: Works seamlessly on desktop and mobile
🔄 Live Processing: Real-time feedback during clip creation

🚀 Quick Start
Prerequisites

Node.js (v14 or higher)
FFmpeg (required for video processing)

FFmpeg Installation
Windows:
bashchoco install ffmpeg
macOS:
bashbrew install ffmpeg
Linux:
bashsudo apt install ffmpeg
Installation

Clone the repository

bashgit clone https://github.com/vinaypandey557/video-clipper.git

cd video-clipper

Setup Backend

bashcd backend
npm install
npm run dev

Setup Frontend (in a new terminal)

bashcd frontend
npm install
npm start

Open your browser


Frontend: http://localhost:3000
Backend API: http://localhost:3001


🛠️ Tech Stack
Backend

Node.js - Runtime environment
Express - Web framework
Multer - File upload handling
FFmpeg - Video processing
UUID - Unique ID generation

Frontend

React - UI framework
Tailwind CSS - Styling
Lucide React - Icons
HTML5 Video - Video player

📋 API Endpoints
MethodEndpointDescriptionPOST/api/uploadUpload video fileGET/api/videosGet all videosGET/api/video/:idGet video detailsPOST/api/clipCreate clipGET/api/healthHealth check
🎯 Usage

Upload a Video

Click "Choose Video File" or drag-and-drop
Supported formats: MP4, AVI, MOV, WMV, MKV
Maximum file size: 500MB


Create a Clip

Select your uploaded video
Use the video player to navigate to your desired start time
Click "Use current time" to set start/end points
Enter a name for your clip
Click "Create Clip"


Download

Once processing is complete, download your clip
Clips are saved in MP4 format
