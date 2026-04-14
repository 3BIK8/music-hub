import { spawn } from "child_process";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (url) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      url,
      {
        resource_type: "auto",
        folder: "music-hub/audio",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
  });
};

export const extractAndUploadAudio = async (youtubeUrl) => {
  return new Promise((resolve, reject) => {
    console.log(`Extracting and uploading audio from ${youtubeUrl}...`);

    const ytProcess = spawn(
      "yt-dlp",
      [
        "--extract-audio",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "128K",
        "-o",
        "-",
        youtubeUrl,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "music-hub/audio",
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result.secure_url);
        }
      },
    );

    ytProcess.stdout.pipe(uploadStream);

    ytProcess.stderr.on("data", (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });

    ytProcess.on("error", (error) => {
      reject(new Error(`yt-dlp process error: ${error.message}`));
    });

    ytProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
};
