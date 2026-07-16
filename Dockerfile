FROM node:18

# 1. Install FFmpeg langsung ke sistem operasi Linux
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Langsung install dependensi tanpa perlu file package.json
RUN npm install express fluent-ffmpeg multer

# 3. Copy seluruh source code (termasuk server.js)
COPY . .

# 4. Buat folder uploads dan berikan izin akses penuh
RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

# 5. Port wajib untuk Hugging Face Spaces
EXPOSE 7860

# 6. Jalankan server
CMD ["node", "server.js"]
