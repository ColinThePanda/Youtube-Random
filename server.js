import express from 'express';
import { join, dirname, resolve } from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();

// Use import.meta.url to get the directory name in ES Modules
const __dirname = dirname(import.meta.url);

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or fallback to 3000
const API_KEY = process.env.API_KEY; // Set your API key here (ensure it's set in environment)

if (!API_KEY) {
    console.error('API_KEY is missing! Please set it in your environment.');
    process.exit(1);
}

// Serve static files from the "public" directory
app.use(express.static(join(__dirname, 'public')));

// API route to search YouTube channels
app.get('/api/search', async (req, res) => {
    const { handle } = req.query;

    try {
        if (!handle) {
            return res.status(400).json({ error: 'You must provide a username handle' });
        }

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${handle}&type=channel&part=snippet`;
        const searchResponse = await fetch(searchUrl);
        if (searchResponse.status === 403) {
            return res.status(403).json({ error: 'API quota exceeded' });
        }

        const searchData = await searchResponse.json();
        res.json(searchData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the main HTML file for any unspecified route (for client-side)
app.get('*', (req, res) => {
    // Use path.resolve to get an absolute path to index.html
    res.sendFile(resolve(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
