module.exports = {
  // Gemini API key
  geminiApiKey: process.env.GEMINI_API_KEY || "AIzaSyBAR1zNNylZq_0E51LRFD29MREc-qwFVj4",
  
  // API endpoint
  geminiApiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  
  // Server settings
  port: process.env.PORT || 5000,
  
  // FFmpeg paths
  ffmpegPath: "C:\\Users\\tokmo\\Downloads\\ffmpeg-master-latest-win64-gpl-shared\\ffmpeg-master-latest-win64-gpl-shared\\bin\\ffmpeg.exe",
  ffprobePath: "C:\\Users\\tokmo\\Downloads\\ffmpeg-master-latest-win64-gpl-shared\\ffmpeg-master-latest-win64-gpl-shared\\bin\\ffprobe.exe"
}; 