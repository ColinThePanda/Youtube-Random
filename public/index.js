const apiKey = process.env.API_KEY;


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-btn').addEventListener('click', () => {
        const username = document.getElementById('username-input').value;
        getUserInfo(username);
    });

    document.getElementById('get-random-video').addEventListener('click', getRandomVideo);
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
});

async function getUserInfo(username) {
    try {
        if (!username.startsWith('@')) {
            document.getElementById('user-info').innerHTML = 'Please enter a valid username with "@" symbol.';
            return;
        }

        const handle = username.replace('@', '');
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${handle}&type=channel&part=snippet`;

        const searchResponse = await fetch(searchUrl);
        if (searchResponse.status === 403) throw new Error("API quota exceeded");

        const searchData = await searchResponse.json();
        if (!searchData.items || searchData.items.length === 0) {
            document.getElementById('user-info').innerHTML = 'No channel found with this handle.';
            return;
        }

        const channel = searchData.items[0];
        const channelId = channel.id.channelId;
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet,statistics`;

        const channelResponse = await fetch(channelUrl);
        if (channelResponse.status === 403) throw new Error("API quota exceeded");

        const channelData = await channelResponse.json();
        if (!channelData.items || channelData.items.length === 0) {
            document.getElementById('user-info').innerHTML = 'Could not retrieve channel details.';
            return;
        }

        const user = channelData.items[0];
        const userInfo = `
            <h2>Channel Info</h2>
            <p><strong>Channel Name:</strong> ${user.snippet.title}</p>
            <p><strong>Subscribers:</strong> ${user.statistics.subscriberCount}</p>
            <p><strong>Total Views:</strong> ${user.statistics.viewCount}</p>
            <p><strong>Number of Videos:</strong> ${user.statistics.videoCount}</p>
        `;
        document.getElementById('user-info').innerHTML = userInfo;

        document.getElementById('user-info').style.display = 'block';
        document.getElementById('get-random-video').style.display = 'inline-block';
        document.getElementById('filter-options').style.display = 'block';
        window.channelId = user.id;

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
            const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${window.channelId}&order=date&part=snippet&type=video&maxResults=${maxResults}&pageToken=${nextPageToken || ''}`;
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

async function filterVideos(videos) {
    const minViews = parseInt(document.getElementById('min-views').value, 10) || 0;
    const maxYears = parseInt(document.getElementById('max-years').value, 10) || 0;
    const minLikes = parseInt(document.getElementById('min-likes').value, 10) || 0;
    const maxDuration = parseInt(document.getElementById('max-duration').value, 10) || 0;

    const currentDate = new Date();
    const videoIds = videos.map(video => video.id.videoId);

    // Split the videoIds into chunks of 50
    const chunkedVideoIds = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        chunkedVideoIds.push(videoIds.slice(i, i + 50));
    }

    let allVideoData = [];
    for (const chunk of chunkedVideoIds) {
        const ids = chunk.join(',');
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${ids}&part=statistics,snippet,contentDetails`;
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json();
        if (statsData.items) {
            allVideoData = allVideoData.concat(statsData.items);
        }
    }

    return allVideoData.filter(video => {
        const viewCount = parseInt(video.statistics.viewCount, 10);
        const likeCount = parseInt(video.statistics.likeCount || '0', 10);
        const publishedDate = new Date(video.snippet.publishedAt);
        const videoAgeYears = (currentDate - publishedDate) / (1000 * 60 * 60 * 24 * 365);

        // Duration in ISO 8601 format, convert to seconds
        const durationISO = video.contentDetails.duration;
        const durationSeconds = convertISO8601ToSeconds(durationISO);

        let keep = true;
        if (minViews && viewCount < minViews) keep = false;
        if (maxYears && videoAgeYears > maxYears) keep = false;
        if (minLikes && likeCount < minLikes) keep = false;
        if (maxDuration && durationSeconds / 60 > maxDuration) keep = false;

        return keep;
    });
}

function convertISO8601ToSeconds(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

function applyFilters() {
    // Display the check mark once filters are applied
    document.getElementById('filter-status').style.display = 'inline-block';
}
