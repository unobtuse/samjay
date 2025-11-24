import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from parent directory .env or local .env
dotenv.config({ path: '.env' });

const YOUTUBE_API_KEY = process.env.YOUTUBE_SYNC_ACCESS_KEY;
const PLAYLIST_ID = 'PLb1Io1u0RaUOZrGIWG1QFbAY6DknURfsc';
const OUTPUT_FILE = 'public/data/videos.json';

async function fetchPlaylistVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_SYNC_ACCESS_KEY not found in .env');
    process.exit(1);
  }

  let videos = [];
  let nextPageToken = '';
  let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=50&key=${YOUTUBE_API_KEY}`;

  try {
    do {
      const response = await fetch(url + (nextPageToken ? `&pageToken=${nextPageToken}` : ''));
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const items = data.items.map(item => ({
        title: item.snippet.title,
        img: item.snippet.thumbnails.maxres ? item.snippet.thumbnails.maxres.url : (item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url),
        link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
      }));

      videos = [...videos, ...items];
      nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    // Filter out private/deleted videos if necessary
    videos = videos.filter(v => v.title !== 'Private video' && v.title !== 'Deleted video');

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(videos, null, 2));
    console.log(`Successfully fetched ${videos.length} videos and saved to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Failed to fetch playlist:', error);
    // Only exit with error if we haven't already saved data via fallback
    if (!fs.existsSync(OUTPUT_FILE)) {
      process.exit(1);
    }
  }
}

fetchPlaylistVideos();
