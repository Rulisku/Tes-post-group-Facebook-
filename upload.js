const fs = require("fs");
const { google } = require("googleapis");

function clean(v, fallback = "") {
  if (v === undefined || v === null || v === "undefined" || v === "null") {
    return fallback;
  }
  return String(v).trim();
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

  console.log("Memulai upload video...");

  const title = clean(process.env.VIDEO_TITLE);
  const description = clean(
    process.env.VIDEO_DESCRIPTION,
    "Uploaded by GitHub Actions"
  );
  const publishAt = clean(process.env.PUBLISH_DATE);
 const location = clean(process.env.LOCATION);

const languageMap = {
  "Indonesia": "id",
  "USA": "en",
  "United States": "en",
  "English": "en",
  "Jepang": "ja",
  "Japan": "ja"
};

const languageCode = languageMap[location] || "id";
  const tagsRaw = clean(process.env.TAGS);
  const aiContent = clean(process.env.AI_CONTENT);
  const audience = clean(process.env.AUDIENCE);
  const ageRestriction = clean(process.env.AGE_RESTRICTION);

  // 🔥 TAGS handling (aman untuk string / kosong)
  const tags = tagsRaw
    ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  // 🔥 BASIC VALIDATION (biar tidak upload sampah kosong)
  if (!title) {
    throw new Error("VIDEO_TITLE wajib diisi");
  }

  const response = await youtube.videos.insert({
    part: ["snippet", "status", "recordingDetails"],

    requestBody: {
      snippet: {
        title,
        description,
        tags: tags.length ? tags : undefined, // jangan kirim empty array
        categoryId: "22",

        // optional metadata (tidak wajib YouTube)
        
      },

      status: {
        privacyStatus: "private",

        // hanya set schedule kalau ada tanggal valid
        publishAt: publishAt || undefined,

        selfDeclaredMadeForKids:
        audience.toLowerCase() === "ya" 
      }
    },

    recordingDetails: {
      locationDescription: location || undefined
    }
  },
                                               
    media: {
      body: fs.createReadStream("video.mp4")
    }
  });

  const videoId = response.data.id;

  console.log("================================");
  console.log("UPLOAD BERHASIL");
  console.log("Video ID:", videoId);
  console.log(`URL: https://www.youtube.com/watch?v=${videoId}`);
  console.log("================================");

  // optional debug (hapus kalau sudah stabil)
  console.log("Metadata:");
  console.log({ location, aiContent, audience, ageRestriction });
}

upload().catch(err => {
  console.error("UPLOAD GAGAL");
  console.error(err?.response?.data || err);
  process.exit(1);
});
