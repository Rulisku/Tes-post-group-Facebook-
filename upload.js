const fs = require("fs");
const { google } = require("googleapis");

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

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],

    requestBody: {
      snippet: {
        title: process.env.VIDEO_TITLE,
        description:
          process.env.VIDEO_DESCRIPTION ||
          "Uploaded by GitHub Actions",
        categoryId: "22"
      },

      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false
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
  console.log(
    "URL:",
    `https://www.youtube.com/watch?v=${videoId}`
  );
  console.log("================================");
}

upload().catch(err => {
  console.error("UPLOAD GAGAL");
  console.error(err);
  process.exit(1);
});
