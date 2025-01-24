const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Use node-fetch to make requests to YouTube API
require('dotenv').config();
const app = express();

const PORT = process.env.PORT || 3000; // Use environment port or fallback to 3000
const API_KEY = process.env.API_KEY; // Set your API key here (ensure it's set in environment)

if (!API_KEY) {
    console.error('API_KEY is missing! Please set it in your environment.');
    process.exit(1);
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

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
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
