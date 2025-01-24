document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-btn').addEventListener('click', () => {
        const username = document.getElementById('username-input').value;
        getUserInfo(username);
    });
});

async function getUserInfo(username) {
    try {
        if (!username.startsWith('@')) {
            document.getElementById('user-info').innerHTML = 'Please enter a valid username with "@" symbol.';
            return;
        }

        const handle = username.replace('@', '');
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${handle}&type=channel&part=snippet`; // Call the server-side API

        const searchResponse = await fetch(searchUrl);
        if (searchResponse.status === 403) throw new Error("API quota exceeded");

        const searchData = await searchResponse.json();
        if (!searchData.items || searchData.items.length === 0) {
            document.getElementById('user-info').innerHTML = 'No channel found with this handle.';
            return;
        }

        const channel = searchData.items[0];
        const channelId = channel.id.channelId;
        const userInfo = `
            <h2>Channel Info</h2>
            <p><strong>Channel Name:</strong> ${channel.snippet.title}</p>
            <p><strong>Channel ID:</strong> ${channelId}</p>
        `;
        document.getElementById('user-info').innerHTML = userInfo;

    } catch (error) {
        document.getElementById('user-info').innerHTML = `Error: ${error.message}`;
    }
}

async function getRandomVideo() {
    try {
        console.log('Fetching random video for channel ID:', window.channelId);

        const maxResults = 50;
        let videos = [];
        let nextPageToken = null;

        // Fetch multiple pages of results
        do {
            const url = `/api/randomVideo?channelId=${window.channelId}&pageToken=${nextPageToken || ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                videos = videos.concat(data.items);
            }
            nextPageToken = data.nextPageToken;
        } while (nextPageToken && videos.length < 500);

        console.log(`Total videos fetched: ${videos.length}`);

        // Filter videos based on user input
        videos = await filterVideos(videos);

        if (videos.length === 0) {
            document.getElementById('random-video').innerHTML = 'No videos match the filter criteria.';
            console.log('No videos match the filter criteria');
            return;
        }

        const randomIndex = Math.floor(Math.random() * videos.length);
        const video = videos[randomIndex];
        const videoLink = `https://www.youtube.com/watch?v=${video.id}`;
        console.log(`Video Link: ${videoLink}`)
        const videoThumbnail = video.snippet.thumbnails.medium.url;
        const videoId = video.id;
        const iframeEmbedCode = `
            <h3>Random Video</h3>
            <p><strong>Title:<br></strong><a href="${videoLink}"> ${video.snippet.title}</a></p>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        `;
        document.getElementById('random-video').innerHTML = iframeEmbedCode;

    } catch (error) {
        console.error('Error fetching random video:', error);
        document.getElementById('random-video').innerHTML = `Error: ${error.message}`;
    }
}
