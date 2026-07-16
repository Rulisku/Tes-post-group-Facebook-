const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const renderJobs = {};

// ==========================================
// CONFIGURATION & SECURITY
// ==========================================
const API_KEY = process.env.RAHASIA_N8N || 'kodesubuh123';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const authenticate = (req, res, next) => {
  const token = req.headers['x-api-key'];
  if (!token || token !== API_KEY) {
    return res.status(401).send('Akses Ditolak: API Key Tidak Valid / Salah!');
  }
  next();
};

app.use(express.json());

// Helper Download URL dengan Fitur Redirect (Bypass Google Drive)
const downloadWithRedirect = (url, targetPath) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if ([301, 302, 303, 307].includes(response.statusCode) && response.headers.location) {
        downloadWithRedirect(response.headers.location, targetPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Gagal download: Status ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(targetPath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    request.on('error', (err) => {
      fs.unlink(targetPath, () => {});
      reject(err);
    });
  });
};

// ==========================================
// ROUTE DASHBOARD
// ==========================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BOT DASHBOARD PRO - File Uploader</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(180deg, #1a102b, #120a1f, #0b0715);
          color: #fff;
          min-height: 100vh;
          margin: 0;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 30px;
          border-radius: 16px;
          width: 100%;
          max-width: 650px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        h1 {
          color: #a855f7;
          margin-bottom: 5px;
          font-size: 28px;
          text-shadow: 0 0 10px rgba(168,85,247,0.5);
        }
        p {
          color: #b4fed2;
          margin-top: 0;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
          text-align: left;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: #cbd5e1;
          font-size: 14px;
        }
        input[type="text"], select {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #4c1d95;
          background: rgba(15, 23, 42, 0.6);
          color: #fff;
          box-sizing: border-box;
          font-size: 14px;
        }
        .file-input-container {
          background: rgba(255,255,255,0.02);
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 8px;
          border: 1px dashed rgba(168,85,247,0.3);
        }
        .scene-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 5px;
        }
        .scene-count {
          font-weight: bold;
          color: #a855f7;
          font-size: 14px;
        }
        .input-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 8px;
        }
        .input-field {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .input-field span {
          min-width: 120px;
          font-size: 13px;
          color: #cbd5e1;
        }
        input[type="file"] {
          flex-grow: 1;
          color: #cbd5e1;
          font-size: 13px;
        }
        button {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add {
          background: #10b981;
          color: white;
          margin-bottom: 15px;
          width: 100%;
          padding: 12px;
        }
        .btn-add:hover {
          background: #059669;
        }
        .btn-delete {
          background: #ef4444;
          color: white;
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 4px;
        }
        .btn-delete:hover {
          background: #dc2626;
        }
        .btn-generate {
          background: #a855f7;
          color: white;
          width: 100%;
          padding: 14px;
          font-size: 16px;
          box-shadow: 0 4px 14px rgba(168,85,247,0.4);
        }
        .btn-generate:hover {
          background: #9333ea;
          transform: translateY(-1px);
        }
        .status-box {
          margin-top: 20px;
          padding: 15px;
          border-radius: 8px;
          background: rgba(0,0,0,0.4);
          border-left: 4px solid #a855f7;
          text-align: left;
          font-family: monospace;
          font-size: 13px;
          display: none;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>BOT DASHBOARD PRO 🚀</h1>
        <p>FFmpeg Engine Status: <strong>Direct File Upload Mode (AI Format Scanner Enabled)</strong></p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
        
        <div class="form-group">
          <label for="apiKey">X-API-KEY (RAHASIA_N8N)</label>
          <input type="text" id="apiKey" value="kodesubuh123" placeholder="Masukkan API Key Anda">
        </div>
        
        <div class="form-group">
          <label for="aspectRatio">Ukuran / Aspek Rasio Video</label>
          <select id="aspectRatio">
            <option value="9:16">Vertikal (9:16) - TikTok / Shorts</option>
            <option value="16:9">Horizontal (16:9) - YouTube Panjang</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Kelola Berkas Adegan</label>
          <div id="fileContainer">
            <div class="file-input-container">
              <div class="scene-header">
                <span class="scene-count">Adegan 1:</span>
                <button class="btn-delete" onclick="removeInput(this)">Hapus</button>
              </div>
              <div class="input-row">
                <div class="input-field">
                  <span>Visual (Foto/Video):</span>
                  <input type="file" class="visual-file" accept="video/*,image/*">
                </div>
                <div class="input-field">
                  <span>Suara (MP3/WAV/M4A/AAC):</span>
                  <input type="file" class="audio-file" accept="audio/*">
                </div>
              </div>
            </div>
          </div>
          <button class="btn-add" onclick="addInput()">➕ Tambah Adegan Baru</button>
        </div>
        
        <button class="btn-generate" onclick="startUploadAndGenerate()">🚀 UPLOAD & GENERATE VIDEO</button>
        <div id="statusBox" class="status-box"></div>
      </div>
      <script>
        function updateLabels() {
          const containers = document.querySelectorAll('.file-input-container');
          containers.forEach((container, index) => {
            container.querySelector('.scene-count').innerText = \`Adegan \${index + 1}:\`;
          });
        }
        function addInput() {
          const container = document.getElementById('fileContainer');
          const div = document.createElement('div');
          div.className = 'file-input-container';
          div.innerHTML = \`
            <div class="scene-header">
              <span class="scene-count">Adegan:</span>
              <button class="btn-delete" onclick="removeInput(this)">Hapus</button>
            </div>
            <div class="input-row">
              <div class="input-field">
                <span>Visual (Foto/Video):</span>
                <input type="file" class="visual-file" accept="video/*,image/*">
              </div>
              <div class="input-field">
                <span>Suara (MP3/WAV/M4A/AAC):</span>
                <input type="file" class="audio-file" accept="audio/*">
              </div>
            </div>
          \`;
          container.appendChild(div);
          updateLabels();
        }
        function removeInput(btn) {
          const container = document.getElementById('fileContainer');
          if (container.children.length > 1) {
            btn.closest('.file-input-container').remove();
            updateLabels();
          } else {
            alert("Minimal harus ada 1 adegan untuk diproses!");
          }
        }
        function startUploadAndGenerate() {
          const apiKey = document.getElementById('apiKey').value;
          const aspectRatio = document.getElementById('aspectRatio').value;
          const statusBox = document.getElementById('statusBox');
          const containers = document.querySelectorAll('.file-input-container');
          const formData = new FormData();
          let visualCount = 0;
          containers.forEach((container) => {
            const visualInput = container.querySelector('.visual-file');
            const audioInput = container.querySelector('.audio-file');
            if (visualInput.files.length > 0) {
              formData.append('visuals', visualInput.files[0]);
              visualCount++;
              if (audioInput.files.length > 0) {
                formData.append('audios', audioInput.files[0]);
              } else {
                const emptyBlob = new Blob([""], { type: "audio/mpeg" });
                formData.append('audios', emptyBlob, "empty.mp3");
              }
            }
          });
          if (visualCount === 0) {
            alert("Mohon isi file visual minimal pada satu adegan!");
            return;
          }
          formData.append('has_audio', 'ya');
          formData.append('aspect_ratio', aspectRatio);
          statusBox.style.display = "block";
          statusBox.style.borderLeftColor = "#a855f7";
          statusBox.innerHTML = "⏳ Bersiap mengupload file...";
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/merge-multiple', true);
          xhr.setRequestHeader('x-api-key', apiKey);
          xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              statusBox.innerHTML = \`
                <strong>⏳ Sedang mengupload berkas ke server... (\${percentComplete}%)</strong>
                <div style="width: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 8px; overflow: hidden;">
                  <div style="width: \${percentComplete}%; background: #10b981; height: 8px; transition: width 0.1s;"></div>
                </div>
              \`;
            }
          };
          xhr.onload = function () {
            if (xhr.status === 200) {
              try {
                const result = JSON.parse(xhr.responseText);
                const jobId = result.jobId;
                statusBox.style.borderLeftColor = "#f59e0b";
                statusBox.innerHTML = \`
                  <strong style="color: #10b981;">✅ FILE BERHASIL DIUPLOAD!</strong><br><br>
                  🆔 <strong>Job ID:</strong> \${jobId}<br><br>
                  <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 12px; border-radius: 8px; color: #b4fed2; margin-bottom: 12px; line-height: 1.5;">
                    📢 <strong>Sudah dapat antrean!</strong> Kamu sekarang bisa aman membuka aplikasi lain atau menutup halaman ini. Proses render video tetap berjalan stabil di background server.
                  </div>
                  📊 <strong>Status:</strong> Menunggu FFmpeg menjahit video...
                \`;
                const checkInterval = setInterval(async () => {
                  try {
                    const statusCheck = await fetch(\`/api/job-status/\${jobId}\`);
                    const statusResult = await statusCheck.json();
                    
                    if (statusResult.status === 'completed') {
                      clearInterval(checkInterval);
                      const downloadLink = \`/api/download-result/\${jobId}\`;
                      statusBox.style.borderLeftColor = "#10b981";
                      statusBox.innerHTML = \`
                        <strong>🎉 RENDER VIDEO SELESAI SUKSES!</strong><br><br>
                        🆔 Job ID: \${jobId}<br><br>
                        <a href="\${downloadLink}" target="_blank" style="display: inline-block; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
                          📥 KLIK DI SINI UNTUK DOWNLOAD VIDEO
                        </a>
                      \`;
                    } else if (statusResult.status === 'failed' || statusResult.status === 'not_found') {
                      clearInterval(checkInterval);
                      statusBox.style.borderLeftColor = "#ef4444";
                      statusBox.innerHTML = \`❌ <strong>Render Gagal!</strong> Terjadi kesalahan pemrosesan kode di FFmpeg Concat.\`;
                    }
                  } catch (err) {
                    clearInterval(checkInterval);
                    statusBox.innerHTML = \`❌ Gagal memantau status: \${err.message}\`;
                  }
                }, 5000);
              } catch (e) {
                statusBox.style.borderLeftColor = "#ef4444";
                statusBox.innerHTML = "❌ Gagal membaca respons JSON: " + xhr.responseText;
              }
            } else {
              statusBox.style.borderLeftColor = "#ef4444";
              statusBox.innerHTML = "❌ Eror Backend: " + xhr.responseText;
            }
          };
          xhr.onerror = function () {
            statusBox.style.borderLeftColor = "#ef4444";
            statusBox.innerHTML = "❌ Gagal Terhubung ke API (Koneksi Terputus).";
          };
          xhr.send(formData);
        }
      </script>
    </body>
    </html>
  `);
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const getAudioDuration = (filePath) => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata.format || !metadata.format.duration) {
        resolve(5);
      } else {
        resolve(parseFloat(metadata.format.duration));
      }
    });
  });
};

const checkAudioTrack = (filePath) => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata.streams) {
        resolve(false);
      } else {
        resolve(metadata.streams.some(stream => stream.codec_type === 'audio'));
      }
    });
  });
};

const cleanGarbage = (jobId) => {
  if (renderJobs[jobId] && renderJobs[jobId].filesToCleanup) {
    console.log(`[Job ${jobId}] Memulai pembersihan berkas sampah...`);
    renderJobs[jobId].filesToCleanup.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Berhasil dihapus: ${path.basename(filePath)}`);
        }
      } catch (e) {
        console.error(`Gagal menghapus file: ${filePath}`, e);
      }
    });
  }
};

// ==========================================
// CORE API: ENDPOINT PROSES VIDEO
// ==========================================
app.post('/api/merge-multiple', authenticate, upload.fields([{ name: 'visuals', maxCount: 50 }, { name: 'audios', maxCount: 50 }]), async (req, res) => {
  const files = req.files;
  let videoPaths = [];
  let audioPaths = [];
  const jobId = 'job-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  
  renderJobs[jobId] = { 
    status: 'processing', 
    finalPath: null, 
    filesToCleanup: [] 
  };
  
  const aspect_ratio = req.body.aspect_ratio || '9:16';
  let width = 1080;
  let height = 1920;
  
  if (aspect_ratio === '16:9') {
    width = 1920;
    height = 1080;
  }
  
  try {
    if (req.body.video_urls) {
      let urls = req.body.video_urls;
      if (typeof urls === 'string') urls = JSON.parse(urls);
      let aUrls = req.body.audio_urls || [];
      if (typeof aUrls === 'string') aUrls = JSON.parse(aUrls);
      
      console.log(`[Job ${jobId}] Mendownload ${urls.length} visual & ${aUrls.length} audio.`);
      
      for (let i = 0; i < urls.length; i++) {
        const tempPath = path.join(__dirname, 'uploads', `dl-video-${i}-${jobId}.mp4`);
        await downloadWithRedirect(urls[i], tempPath);
        await new Promise((resolve) => {
          ffmpeg.ffprobe(tempPath, (err, data) => {
            console.log(`[LOG DETEKTIF] VIDEO PROBE (Scene ${i}):`, JSON.stringify(data, null, 2));
            resolve();
          });
        });
        videoPaths.push(tempPath);
        renderJobs[jobId].filesToCleanup.push(tempPath);
      }
      
      for (let i = 0; i < aUrls.length; i++) {
        const tempAPath = path.join(__dirname, 'uploads', `dl-audio-${i}-${jobId}`);
        await downloadWithRedirect(aUrls[i], tempAPath);
        audioPaths.push(tempAPath);
        renderJobs[jobId].filesToCleanup.push(tempAPath);
      }
    } else if (files && files['visuals']) {
      videoPaths = files['visuals'].map(f => f.path);
      files['visuals'].forEach(f => renderJobs[jobId].filesToCleanup.push(f.path));
      
      if (files['audios']) {
        files['audios'].forEach(f => {
          renderJobs[jobId].filesToCleanup.push(f.path);
          if (f.size > 100) {
            audioPaths.push(f.path);
          } else {
            audioPaths.push(null);
          }
        });
      }
    }
    
    const totalScenes = videoPaths.length;
    if (totalScenes === 0) {
      return res.status(400).send('Error: File media/video/gambar tidak ditemukan.');
    }
    
    res.json({ 
      jobId: jobId, 
      status: 'processing', 
      message: `Sukses mendaftarkan ${totalScenes} adegan dengan aspek rasio ${aspect_ratio}.` 
    });

    const processAsynchronousRender = async () => {
      const tempOutputs = [];
      const processSingleScene = (vPath, aPath, index) => {
        return new Promise(async (resolve, reject) => {
          const outPath = path.join(__dirname, 'uploads', `temp-scene-${index}-${jobId}.mp4`);
          tempOutputs.push(outPath);
          renderJobs[jobId].filesToCleanup.push(outPath);
          
          const hasAudio = !!aPath;
          const probe = await new Promise((resolve) => {
            ffmpeg.ffprobe(vPath, (err, data) => {
              resolve(data);
            });
          });

  
