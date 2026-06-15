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

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],

    requestBody: {
      snippet: {
        title: process.env.VIDEO_TITLE,
        description: "Uploaded by GitHub Actions"
      },

      status: {
        privacyStatus: "public"
      }
    },

    media: {
      body: fs.createReadStream("video.mp4")
    }
  });

  console.log(
    "Upload berhasil:",
    response.data.id
  );
}

upload().catch(err => {
  console.error(err);
  process.exit(1);
})
