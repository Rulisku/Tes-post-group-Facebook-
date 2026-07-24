const fs = require("react-native-fs" in global ? "react-native-fs" : "fs");
const { google } = require("googleapis");

function clean(v, fallback = "") {
  if (
    v === undefined ||
    v === null ||
    v === "undefined" ||
    v === "null"
  ) {
    return fallback;
  }

  return String(v).trim();
}

// Cari koordinat otomatis dari nama lokasi
async function getCoordinates(place) {
  if (!place) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "github-actions-youtube-uploader"
      }
    });

    const data = await response.json();

    if (!data.length) {
      console.log("Lokasi tidak ditemukan:", place);
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      description: data[0].display_name
    };

  } catch (err) {
    console.log("Gagal mencari koordinat");
    console.log(err);
    return null;
  }
}

async function upload() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client
  });

  // Cek channel aktif
  const me = await youtube.channels.list({
    part: ["snippet"],
    mine: true
  });

  console.log(
    "Upload ke channel:",
    me.data.items[0].snippet.title
  );

  const title = clean(process.env.VIDEO_TITLE);
  const description = clean(process.env.VIDEO_DESCRIPTION, "Uploaded by GitHub Actions");

  const publishDate = clean(process.env.PUBLISH_DATE);
  console.log("PUBLISH_DATE =", publishDate);
  
  const videoTime = clean(process.env.VIDEO_TIME);
  console.log("VIDEO_TIME =", videoTime);
  
  let publishAt = "";

  if (publishDate && videoTime) {
    const [d, m, y] = publishDate.split("-");
    publishAt = `${y}-${m}-${d}T${videoTime}:00+07:00`;
  }
  console.log("FINAL PUBLISH_AT =", publishAt);
  console.log("PUBLISH_AT RAW =", publishAt);
  console.log("NOW UTC =", new Date().toISOString());
  
  const location = clean(process.env.LOCATION);

  const languageMap = {
    "Indonesia": "id",
    "USA": "en",
    "United States": "en",
    "Japan": "ja",
    "Jepang": "ja",
    "Korea": "ko",
    "Germany": "de",
    "France": "fr"
  };

  const language = languageMap[location] || "en";

  console.log("LOCATION:", location);
  console.log("LANGUAGE:", language);

  const tagsRaw = clean(process.env.TAGS);
  const audience = clean(process.env.AUDIENCE);
  const aiContent = clean(process.env.AI_CONTENT);
  const ageRestriction = clean(process.env.AGE_RESTRICTION);

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean)
    : [];

  console.log("LOCATION:", location);

  // Cari koordinat otomatis
  const geo = await getCoordinates(location);

  if (geo) {
    console.log("Koordinat ditemukan:");
    console.log(geo);
  } else {
    console.log("Lokasi tidak dikirim ke YouTube");
  }
  console.log("FINAL PUBLISH_AT =", publishAt);
  
  const response = await youtube.videos.insert({
    part: [
      "snippet",
      "status",
      "recordingDetails"
    ],
    requestBody: {
      snippet: {
        title,
        description,
        categoryId: "22",
        tags: tags.length ? tags : undefined,
        defaultLanguage: language,
        defaultAudioLanguage: language
      },
      status: {
        privacyStatus: publishAt ? "private" : "public",
        publishAt: publishAt || undefined,
        selfDeclaredMadeForKids: audience.toLowerCase() === "ya"
      },
      recordingDetails: geo
        ? {
            locationDescription: geo.description,
            location: {
              latitude: geo.latitude,
              longitude: geo.longitude
            }
          }
        : undefined
    },
    media: {
      body: fs.createReadStream("video.mp4")
    }
  });

  const videoId = response.data.id;

  const check = await youtube.videos.list({
    part: ["recordingDetails"],
    id: [videoId]
  });

  console.log(JSON.stringify(check.data, null, 2));

  console.log("================================");
  console.log("UPLOAD BERHASIL");
  console.log("Video ID:", videoId);
  console.log(`URL: https://www.youtube.com/watch?v=${videoId}`);
  console.log("================================");

  // 🌟 PROSES KUSTOM THUMBNAIL (Shorts & Video Panjang Anti-Error)
  const thumbId = clean(process.env.THUMBNAIL_ID);
  const videoType = clean(process.env.VIDEO_TYPE);
  if (videoType === "LONG" &&
  thumbId &&
  thumbId !== "undefined" &&
  thumbId !== "null" &&
  thumbId !== "") {
    console.log(`Menemukan Thumbnail ID: ${thumbId}. Mengunduh & memasang kustom thumbnail...`);
    try {
      const thumbPath = "thumbnail.jpg";
      const driveUrl = `https://docs.google.com/uc?export=download&id=${thumbId}`;
      
      const thumbResponse = await fetch(driveUrl);
      if (!thumbResponse.ok) throw new Error("Gagal mengunduh file dari Google Drive API");
      
      const buffer = await thumbResponse.arrayBuffer();
      fs.writeFileSync(thumbPath, Buffer.from(buffer));
      
      await youtube.thumbnails.set({
        videoId: videoId,
        media: {
          mimeType: "image/jpeg",
          body: fs.createReadStream(thumbPath)
        }
      });
      console.log("✅ Kustom Thumbnail Berhasil Dipasang!");
    } catch (thumbErr) {
      console.error("❌ Gagal memasang thumbnail (Video utama tetap aman terupload):", thumbErr.message);
    }
  } else {
    console.log("💡 Tidak ada data thumbnail (Shorts Mode). Pemasanan kustom thumbnail dilewati.");
  }

  console.log({
    location,
    aiContent,
    audience,
    ageRestriction,
    tags
  });
}

upload().catch(err => {
  console.error("UPLOAD GAGAL");
  console.error(err?.response?.data || err);
  process.exit(1);
});
