
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio'); // Still needed for potential future parsing or if API response is incomplete
const fs = require('fs');
const path = require('path');

const ITCHIO_API_KEY = process.env.ITCHIO_API_KEY;
const ITCHIO_API_BASE_URL = 'https://itch.io/api/1';

const OUTPUT_JSON_PATH = path.join(__dirname, '../public/game-projects.json');
const IMAGES_DIR = path.join(__dirname, '../public/images/projects');

async function fetchItchIoGames() {
  if (!ITCHIO_API_KEY) {
    console.error('ITCHIO_API_KEY environment variable is not set. Please set it to your Itch.io API key.');
    return [];
  }

  try {
    const response = await axios.get(`${ITCHIO_API_BASE_URL}/key/my-games`, {
      headers: {
        'Authorization': `Bearer ${ITCHIO_API_KEY}`,
      },
    });
    return response.data.games || [];
  } catch (error) {
    console.error('Error fetching games from Itch.io API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return [];
  }
}

async function downloadImage(imageUrl, gameId) {
  if (!imageUrl) {
    console.warn(`No image URL provided for game ID: ${gameId}`);
    return null;
  }
  try {
    const response = await axios({
      url: imageUrl,
      responseType: 'stream',
    });

    const imageFileName = `${gameId}${path.extname(imageUrl).split('?')[0]}`;
    const imagePath = path.join(IMAGES_DIR, imageFileName);

    await fs.promises.mkdir(IMAGES_DIR, { recursive: true });
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`images/projects/${imageFileName}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading image ${imageUrl} for ${gameId}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Starting Itch.io game data fetch...');
  const itchIoGames = await fetchItchIoGames();
  const allGameData = [];

  for (const game of itchIoGames) {
    // Assuming API response has: id, title, short_text, cover_url, url
    const gameId = game.id;
    const title = game.title;
    const description = game.short_text || '';
    const coverImageUrl = game.cover_url;
    const itchUrl = game.url;

    if (!gameId || !title || !itchUrl) {
      console.warn(`Skipping game due to missing essential data: ${JSON.stringify(game)}`);
      continue;
    }

    const localImagePath = await downloadImage(coverImageUrl, gameId);
    if (localImagePath) {
      allGameData.push({
        id: String(gameId),
        title: title,
        description: description,
        imageUrl: localImagePath,
        itchUrl: itchUrl,
        tags: [], // Itch.io API might provide tags, need to check response structure
      });
    } else {
      console.warn(`Skipping game ${title} (ID: ${gameId}) due to image download failure.`);
    }
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(allGameData, null, 2));
  console.log(`Successfully updated ${OUTPUT_JSON_PATH} with ${allGameData.length} games.`);
}

main();
