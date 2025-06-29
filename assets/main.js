// Globale DOM-Elemente
const homeHeader = document.getElementById('home-header');
const radioHeader = document.getElementById('radio-header');
const rightPaneContent = document.getElementById('right-pane-content');
const visualizerContainer = document.getElementById('visualizer-container');
const visualizerCanvas = document.getElementById('visualizer-canvas');
const vizStyleBtn = document.getElementById('viz-style-btn');
const genreListUl = document.getElementById('genre-list');
const albumListUl = document.getElementById('album-list');
const audioPlayer = document.getElementById('audio-player');
const nowPlayingDiv = document.getElementById('now-playing');
const artistSearchBtn = document.getElementById('artist-search-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const timelineSlider = document.getElementById('timeline-slider');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const volumeSlider = document.getElementById('volume-slider');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const searchResultsWrapper = document.getElementById('search-results-wrapper');
const searchResultsHeader = document.getElementById('search-results-header');
const currentCoverArtContainer = document.getElementById('current-cover-art-container');
const coverZoomModal = document.getElementById('cover-zoom-modal');
const zoomedCoverImage = document.getElementById('zoomed-cover-image');
const queueWrapper = document.getElementById('queue-wrapper');
const queueHeader = document.getElementById('queue-header');
const favoritesWrapper = document.getElementById('favorites-wrapper');
const favoritesHeader = document.getElementById('favorites-header');
const repeatBtn = document.getElementById('repeat-btn');
const repeatIcon = document.getElementById('repeat-icon');
const repeatOneIcon = document.getElementById('repeat-one-icon');
const aiSearchToggle = document.getElementById('ai-search-toggle');
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsToggleBtn = document.getElementById('lyrics-toggle-btn');
const searchSuggestions = document.getElementById('search-suggestions');
const artistViewWrapper = document.getElementById('artist-view-wrapper');
const artistViewHeader = document.getElementById('artist-view-header');


const EXTERNAL_SEARCH_PLATFORMS = [
    { name: 'Spotify', url: `https://open.spotify.com/search/`, icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.19 14.39c-.24.36-.68.48-1.04.24-2.85-1.74-6.42-2.12-10.51-.98-.42.07-.75-.24-.82-.66s.24-.75.66-.82c4.47-1.23 8.39-.81 11.51 1.05.35.22.47.68.25 1.04zm.8-2.6c-.29.44-.81.59-1.25.3-3.23-1.98-7.85-2.5-11.45-1.37-.51.16-.99-.17-1.14-.68s.17-.99.68-1.14c4.07-1.28 9.1-0.68 12.78 1.5.44.27.59.8.32 1.24zm.08-2.71c-3.82-2.28-9.94-2.43-13.32-1.34-.58.19-1.18-.15-1.37-.73s.15-1.18.73-1.37c3.83-1.23 10.54-1.05 14.88 1.5.53.31.73.95.42 1.48s-.95.73-1.48.42z"/></svg>' },
    { name: 'Amazon Music', url: `https://music.amazon.de/search/`, icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.25-5.32c-.41.28-.6.78-.32 1.19.28.41.78.6 1.19.32l5-3.5c.38-.27.53-.76.33-1.16s-.68-.66-1.16-.43L12.5 14.5v-8c0-.41-.34-.75-.75-.75s-.75.34-.75.75v8.82z"/></svg>' },
    { name: 'YouTube Music', url: `https://music.youtube.com/search?q=`, icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 13.5c-3.03 0-5.5-2.47-5.5-5.5s2.47-5.5 5.5-5.5 5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5zm-2.5-5.5l4-2.5v5l-4-2.5z"/></svg>' }
];

const RADIO_STATIONS = window.PLAYER_DATA.radioStations || [];

// State
let currentPlayingTrackId = null;
let currentPlayingRadioId = null;
let isSeeking = false;
let isShuffleActive = false;
let repeatMode = 'off';
let playHistory = [];
let favorites = [];
let favoriteRadios = [];
let playQueue = [];
const geminiApiKey = window.PLAYER_DATA.geminiApiKey;
let isAiSearchActive = false;
let isAiSearching = false;
let searchResultsCache = [];
let lastSearchQuery = '';
let lastSearchWasAi = false;
let isLyricsVisible = false;
let lastAiPrompt = '';
let lastAiResponse = '';
let hasSyncedLyrics = false;
let lyricsScrollAnimationId = null;
let lastArtistViewed = null; 

// Visualizer State
let audioContext, analyser, sourceNode, dataArray, bufferLength;
let isVisualizerInitialized = false;
let vizAnimationId;
let currentVizStyle = 'bars';
const vizStyles = ['bars', 'starburst', 'waveGradient', 'frequencyGrid', 'tunnel', 'shockwave'];


function initVisualizer() {
    if (isVisualizerInitialized || !audioPlayer) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        if (!sourceNode) {
            sourceNode = audioContext.createMediaElementSource(audioPlayer);
        }
        
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        isVisualizerInitialized = true;
        renderVisualizerFrame();
        console.log("Visualizer initialized successfully.");
    } catch (e) {
        console.error("AudioContext initialization failed:", e);
        visualizerContainer.style.display = 'none';
    }
}


function drawBars(ctx, width, height) { let x = 0; const barWidth = (width / bufferLength) * 1.5; for (let i = 0; i < bufferLength; i++) { const barHeight = (dataArray[i] / 255) * height; const hue = i * 2.5; ctx.fillStyle = `hsl(${hue}, 80%, 50%)`; ctx.fillRect(x, height - barHeight, barWidth, barHeight); x += barWidth + 1; } }
function drawStarburst(ctx, width, height) { const centerX = width / 2; const centerY = height / 2; ctx.lineWidth = 2; for (let i = 0; i < bufferLength; i++) { const angle = (i / bufferLength) * Math.PI * 2; const magnitude = dataArray[i] / 255; const radius = magnitude * (height / 2) * 0.9; const hue = i * 2.5; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)); ctx.strokeStyle = `hsl(${hue}, 100%, ${50 + magnitude * 25}%)`; ctx.stroke(); } }
function drawWaveGradient(ctx, width, height) { const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, '#FF0000'); gradient.addColorStop(0.25, '#FFFF00'); gradient.addColorStop(0.5, '#00FF00'); gradient.addColorStop(0.75, '#0000FF'); gradient.addColorStop(1, '#FF00FF'); ctx.lineWidth = 3; ctx.strokeStyle = gradient; ctx.beginPath(); const sliceWidth = width * 1.0 / bufferLength; let x = 0; for (let i = 0; i < bufferLength; i++) { const v = dataArray[i] / 128.0; const y = v * height / 2; if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); } x += sliceWidth; } ctx.lineTo(width, height / 2); ctx.stroke(); }
function drawFrequencyGrid(ctx, width, height) { const gridSize = 16; const cellWidth = width / gridSize; const cellHeight = height / gridSize; const step = Math.floor(bufferLength / (gridSize * gridSize)); for (let y = 0; y < gridSize; y++) { for (let x = 0; x < gridSize; x++) { const dataIndex = (y * gridSize + x) * step; const dataValue = dataArray[dataIndex] || 0; const hue = dataValue * 1.5; const lightness = Math.pow(dataValue / 255, 2) * 50; ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`; ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight); } } }
function drawTunnel(ctx, width, height) { const centerX = width / 2; const centerY = height / 2; ctx.lineWidth = 2; for (let i = bufferLength - 1; i >= 0; i--) { const dataValue = dataArray[i]; const radius = dataValue * (height * 0.005); const hue = (i * 2 + performance.now() * 0.1) % 360; ctx.strokeStyle = `hsl(${hue}, 90%, 55%)`; ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.stroke(); } }
function drawShockwave(ctx, width, height) { const centerX = width / 2; const centerY = height / 2; const innerRadius = 30; ctx.lineWidth = 3; for (let i = 0; i < bufferLength; i++) { const barLength = (dataArray[i] / 255) * (height / 2.5); const angle = (i / bufferLength) * Math.PI * 2; const hue = i * 2.5; const startX = centerX + innerRadius * Math.cos(angle); const startY = centerY + innerRadius * Math.sin(angle); const endX = centerX + (innerRadius + barLength) * Math.cos(angle); const endY = centerY + (innerRadius + barLength) * Math.sin(angle); ctx.beginPath(); ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`; ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke(); } }

function renderVisualizerFrame() {
    if (!isVisualizerInitialized || audioPlayer.paused || isLyricsVisible) {
        if(vizAnimationId) cancelAnimationFrame(vizAnimationId);
        vizAnimationId = null;
        const canvasCtx = visualizerCanvas.getContext('2d');
        canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        return;
    }
    
    vizAnimationId = requestAnimationFrame(renderVisualizerFrame);
    
    const canvasCtx = visualizerCanvas.getContext('2d');
    if (document.fullscreenElement === visualizerContainer) { visualizerCanvas.width = window.innerWidth; visualizerCanvas.height = window.innerHeight; } else { visualizerCanvas.width = visualizerContainer.clientWidth; visualizerCanvas.height = visualizerContainer.clientHeight; }
    const width = visualizerCanvas.width; const height = visualizerCanvas.height;
    canvasCtx.fillStyle = 'rgba(18, 18, 18, 0.4)'; canvasCtx.fillRect(0, 0, width, height);
    
    if (analyser) {
        switch (currentVizStyle) {
            case 'starburst': case 'frequencyGrid': case 'tunnel': case 'shockwave': case 'bars': analyser.getByteFrequencyData(dataArray); break;
            case 'waveGradient': analyser.getByteTimeDomainData(dataArray); break;
        }
        switch (currentVizStyle) {
            case 'starburst': drawStarburst(canvasCtx, width, height); break;
            case 'waveGradient': drawWaveGradient(canvasCtx, width, height); break;
            case 'frequencyGrid': drawFrequencyGrid(canvasCtx, width, height); break;
            case 'tunnel': drawTunnel(canvasCtx, width, height); break;
            case 'shockwave': drawShockwave(canvasCtx, width, height); break;
            default: drawBars(canvasCtx, width, height); break;
        }
    }
}

function formatTime(s) { if (isNaN(s) || s < 0) return '0:00'; const m = Math.floor(s/60); const sec = Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; }
function updateTimelineSliderVisual() { const p = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0; timelineSlider.style.background = `linear-gradient(to right, #1DB954 ${p}%, #535353 ${p}%)`; }
function updateVolumeSliderVisual() { const p = audioPlayer.muted ? 0 : (parseFloat(volumeSlider.value)); volumeSlider.style.background = `linear-gradient(to right, #1DB954 ${p}%, #535353 ${p}%)`; }

function playNextLogicalTrack() {
    if (playQueue.length > 0) { const nextTrackId = playQueue.shift(); updateQueueSection(); if(queueHeader.classList.contains('selected')) queueHeader.click(); const track = findTrackById(nextTrackId); if (track) { playTrack(track); return; } }
    const currentListView = document.querySelector('#right-pane-content ul'); if (!currentListView) return;
    const tracksInView = Array.from(currentListView.querySelectorAll('.track-list-item[data-id]')).map(el => findTrackById(el.dataset.id)); if (tracksInView.length === 0) return;
    let nextTrack;
    if (isShuffleActive) { let potential = tracksInView.filter(t => !currentPlayingTrackId || t.id !== currentPlayingTrackId); if (potential.length === 0) potential = tracksInView; nextTrack = potential[Math.floor(Math.random() * potential.length)];
    } else { const currentIndex = currentPlayingTrackId ? tracksInView.findIndex(t => t.id === currentPlayingTrackId) : -1; nextTrack = (currentIndex > -1 && currentIndex < tracksInView.length - 1) ? tracksInView[currentIndex + 1] : null; }
    if (nextTrack) { playTrack(nextTrack); } else if (repeatMode === 'all' && tracksInView.length > 0) { playTrack(tracksInView[0]); } else { playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; }
}

function playPreviousLogicalTrack() { if (audioPlayer.currentTime > 3 || playHistory.length <= 1) { audioPlayer.currentTime = 0; return; } playHistory.pop(); const prevTrackId = playHistory.pop(); if (prevTrackId) { const prevTrack = findTrackById(prevTrackId); if(prevTrack) playTrack(prevTrack); } }

async function fetchAndDisplayCover(track, station) {
    const coverImage = document.getElementById('current-cover-art-image');
    const placeholder = document.getElementById('current-cover-art-placeholder');
    const showErrorPlaceholder = () => {
        coverImage.style.display = 'none';
        placeholder.style.display = 'flex';
        const name = station ? station.name : (track ? track.title : '');
        const initial = name ? name.charAt(0).toUpperCase() : '♪';
        placeholder.innerHTML = `<span style="font-size: 4em; font-weight: 500; color: #ccc;">${initial}</span>`;
    };
    coverImage.onerror = showErrorPlaceholder;
    placeholder.innerHTML = 'Lade...';
    coverImage.style.display = 'none';
    placeholder.style.display = 'flex';
    if (station) { coverImage.src = station.logoUrl; coverImage.style.display = 'block'; placeholder.style.display = 'none'; return; }
    if (track) {
        if (track.has_cover) {
            try {
                const response = await fetch(`api/cover_fetcher.php?path=${encodeURIComponent(track.path)}`);
                if (!response.ok) throw new Error('Cover fetch failed');
                const data = await response.json();
                if (data && data.coverData) {
                    coverImage.src = data.coverData;
                    coverImage.style.display = 'block';
                    placeholder.style.display = 'none';
                } else { coverImage.onerror(); }
            } catch (error) { console.error(error); coverImage.onerror(); }
        } else { coverImage.onerror(); }
        return;
    }
    placeholder.innerHTML = 'Cover';
}

function playRadioStation(station) {
    if (!station) return;
    document.body.classList.remove('no-track-selected');

    if (currentPlayingRadioId === station.id) {
        audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
        return;
    }

    if (!isVisualizerInitialized) initVisualizer();

    document.body.classList.add('radio-mode');
    currentPlayingRadioId = station.id;
    currentPlayingTrackId = null;
    hasSyncedLyrics = false;
    
    clearArtistContext();

    audioPlayer.setAttribute('crossorigin', 'anonymous');
    audioPlayer.src = `api/radio_proxy.php?id=${station.id}`;
    audioPlayer.load();

    audioPlayer.play().catch(err => {
        console.error("Radio play error:", err);
        nowPlayingDiv.textContent = "Fehler bei der Radio-Wiedergabe.";
    });

    nowPlayingDiv.innerHTML = `<span id="now-playing-title">${station.name}</span>`;
    artistSearchBtn.style.display = 'none';

    fetchAndDisplayCover(null, station);

    lyricsToggleBtn.disabled = true;
    lyricsToggleBtn.classList.remove('active', 'lyrics-available');
    lyricsContainer.classList.remove('visible');
    isLyricsVisible = false;
    document.querySelectorAll('#right-pane-content .playing').forEach(el => el.classList.remove('playing'));
    const stationElement = document.querySelector(`.radio-list-item[data-id="${station.id}"]`);
    if (stationElement) stationElement.classList.add('playing');
}

function createLyricsPulse(element) {
    if (!element) return;
    element.classList.add('lyrics-pulse');
    setTimeout(() => {
        element.classList.remove('lyrics-pulse');
    }, 2000);
}

function playTrack(track) {
    if (!track) return;
    document.body.classList.remove('no-track-selected');
    
    if (!searchResultsHeader.classList.contains('selected') && lastSearchQuery) {
        lastSearchQuery = '';
        searchResultsCache = [];
        updateSearchResultsSectionVisibility();
    }
    
    let artistName = track.artist;
    if (!artistName && track.title.includes(' - ')) {
        artistName = track.title.split(' - ')[0].trim();
    }
    if (lastArtistViewed && artistName !== lastArtistViewed) {
        clearArtistContext();
    }
    
    if (currentPlayingTrackId === track.id) { 
        audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause(); 
        return; 
    }

    if (!isVisualizerInitialized) initVisualizer();
    
    document.body.classList.remove('radio-mode');
    currentPlayingTrackId = track.id;
    currentPlayingRadioId = null;
    
    audioPlayer.setAttribute('crossorigin', 'anonymous');
    audioPlayer.src = `api/stream.php?path=${encodeURIComponent(track.path)}`;
    audioPlayer.load();

    audioPlayer.play().catch(err => {
        console.error("Track play error:", err);
        nowPlayingDiv.textContent = "Fehler bei der Titel-Wiedergabe.";
    });

    nowPlayingDiv.innerHTML = `<span id="now-playing-title">${track.title}</span>`;
    
    if (artistName) {
        artistSearchBtn.dataset.artist = artistName;
        artistSearchBtn.style.display = 'flex';
    } else {
        artistSearchBtn.style.display = 'none';
        delete artistSearchBtn.dataset.artist;
    }

    if (playHistory[playHistory.length - 1] !== currentPlayingTrackId) { playHistory.push(currentPlayingTrackId); if (playHistory.length > 200) playHistory.shift(); localStorage.setItem('webPlayerHistory', JSON.stringify(playHistory)); }
    
    fetchAndDisplayCover(track, null);

    if (lyricsScrollAnimationId) {
        cancelAnimationFrame(lyricsScrollAnimationId);
        lyricsScrollAnimationId = null;
    }
    lyricsContainer.innerHTML = '';
    lyricsContainer.classList.remove('visible');
    lyricsToggleBtn.classList.remove('active', 'lyrics-available');
    lyricsToggleBtn.title = 'Songtext anzeigen';
    isLyricsVisible = false;
    hasSyncedLyrics = false;

    if (track.synced_lyrics && track.synced_lyrics.length > 0) {
        hasSyncedLyrics = true;
        track.synced_lyrics.forEach(line => {
            const p = document.createElement('p');
            p.className = 'lyric-line';
            p.dataset.time = line[0];
            p.textContent = line[1];
            lyricsContainer.appendChild(p);
        });
    } else if (track.full_lyrics) {
        lyricsContainer.innerHTML = `<p>${track.full_lyrics.replace(/\n/g, '<br>')}</p>`;
    }

    if (hasSyncedLyrics || track.full_lyrics) {
        lyricsToggleBtn.disabled = false;
        lyricsToggleBtn.classList.add('lyrics-available');
        createLyricsPulse(lyricsToggleBtn);
    } else {
        lyricsToggleBtn.disabled = true;
        lyricsContainer.innerHTML = '<p>Kein Songtext für diesen Titel verfügbar.</p>';
    }

    document.querySelectorAll('#right-pane-content .playing').forEach(el => el.classList.remove('playing'));
    const trackElement = document.querySelector(`.track-list-item[data-id="${track.id}"]`);
    if (trackElement) { trackElement.classList.add('playing'); trackElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

function updateSyncedLyrics() {
    if (!isLyricsVisible || !hasSyncedLyrics) return;

    const currentTime = audioPlayer.currentTime;
    const lines = lyricsContainer.querySelectorAll('.lyric-line');
    let currentLine = null;

    for (let i = 0; i < lines.length; i++) {
        const lineTime = parseFloat(lines[i].dataset.time);
        const nextLineTime = (i + 1 < lines.length) ? parseFloat(lines[i + 1].dataset.time) : Infinity;

        if (currentTime >= lineTime && currentTime < nextLineTime) {
            currentLine = lines[i];
            break;
        }
    }

    if (currentLine && !currentLine.classList.contains('current-lyric')) {
        lines.forEach(line => line.classList.remove('current-lyric'));
        currentLine.classList.add('current-lyric');
        currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


function animateUnsyncedLyricsScroll() {
    if (lyricsScrollAnimationId) {
        cancelAnimationFrame(lyricsScrollAnimationId);
    }

    function loop() {
        if (!isLyricsVisible || hasSyncedLyrics || audioPlayer.paused) {
            lyricsScrollAnimationId = null;
            return;
        }

        const scrollableHeight = lyricsContainer.scrollHeight - lyricsContainer.clientHeight;
        if (audioPlayer.duration > 0 && scrollableHeight > 0) {
            const targetScrollTop = (audioPlayer.currentTime / audioPlayer.duration) * scrollableHeight;
            const currentScrollTop = lyricsContainer.scrollTop;
            const smoothingFactor = 0.05;
            const newScrollTop = currentScrollTop + (targetScrollTop - currentScrollTop) * smoothingFactor;
            if (Math.abs(newScrollTop - currentScrollTop) > 0.5) {
                lyricsContainer.scrollTop = newScrollTop;
            }
        }

        lyricsScrollAnimationId = requestAnimationFrame(loop);
    }

    lyricsScrollAnimationId = requestAnimationFrame(loop);
}


function navigateToTrackAndPlay(trackId) { const track = findTrackById(trackId); if (!track) return; const albumKey = track.original_folder; const albumElement = document.querySelector(`#album-list li[data-folder-key="${albumKey}"]`); if (albumElement) { if (!albumElement.classList.contains('selected')) { albumElement.click(); } requestAnimationFrame(() => { playTrack(track); }); } else { playTrack(track); } }

function getUniqueArtists() { const artistSet = new Set(); Object.values(PLAYER_DATA.tracks).flat().forEach(track => { if (track.artist) { artistSet.add(track.artist); } }); return Array.from(artistSet); }
async function loadCoverForElement(element, track) { const coverContainer = element.querySelector('.cover-container') || element; if (!track || !track.has_cover) { coverContainer.textContent = 'Kein Cover'; return; } try { const response = await fetch(`api/cover_fetcher.php?path=${encodeURIComponent(track.path)}`); if (!response.ok) throw new Error('Cover fetch failed'); const data = await response.json(); if (data && data.coverData) { coverContainer.innerHTML = `<img src="${data.coverData}" alt="${track.title}" loading="lazy">`; } else { coverContainer.textContent = 'Kein Cover'; } } catch (error) { console.error(error); coverContainer.textContent = 'Fehler'; } }

function renderHomePage() {
    rightPaneContent.innerHTML = '';

    const createHomeSection = (title, items, clickHandlerAttribute, idField, titleField) => {
        if (!items || items.length === 0) return;
        const section = document.createElement('div');
        section.className = 'home-section';
        section.innerHTML = `<h2>${title}</h2>`;
        const list = document.createElement('ul');
        list.className = 'home-row';
        items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'home-row-item';

            const id = (typeof item === 'object' && item !== null) ? item[idField] : item;
            const displayTitle = (typeof item === 'object' && item !== null) ? item[titleField] : item;

            listItem.dataset[clickHandlerAttribute] = id;
            listItem.innerHTML = `<div class="cover-container">Lade...</div><div class="item-title">${displayTitle}</div>`;
            list.appendChild(listItem);

            let coverTrack = item;
            if (typeof item !== 'object' || !item.id) {
                 if (clickHandlerAttribute === 'artistName') {
                    coverTrack = Object.values(PLAYER_DATA.tracks).flat().find(t => t.artist === id);
                } else if (clickHandlerAttribute === 'albumKey') {
                    coverTrack = PLAYER_DATA.tracks[id] ? PLAYER_DATA.tracks[id][0] : null;
                }
            }
            loadCoverForElement(listItem, coverTrack);
        });
        section.appendChild(list);
        rightPaneContent.appendChild(section);
    };

    const recentTracks = [...new Set(playHistory)].reverse().slice(0, 10).map(findTrackById).filter(Boolean);
    createHomeSection('Zuletzt gehört', recentTracks, 'trackId', 'id', 'title');

    const favTracks = getFavoriteTracksData().slice(0, 10);
    createHomeSection('Deine Favoriten', favTracks, 'trackId', 'id', 'title');

    const currentYear = new Date().getFullYear();
    const yearTracks = Object.values(PLAYER_DATA.tracks).flat()
        .filter(track => track.year && track.year.toString().includes(currentYear.toString()))
        .sort(() => 0.5 - Math.random()).slice(0, 10);
    createHomeSection(`Highlights ${currentYear}`, yearTracks, 'trackId', 'id', 'title');

    const allArtists = getUniqueArtists();
    if (allArtists.length > 0) {
        const randomArtists = allArtists.sort(() => 0.5 - Math.random()).slice(0, 10);
        createHomeSection('Entdecke deine Interpreten', randomArtists, 'artistName', 'artist', 'artist');
    }

    const allAlbumKeys = Object.keys(PLAYER_DATA.tracks);
    if (allAlbumKeys.length > 1) {
        const randomAlbums = allAlbumKeys.sort(() => 0.5 - Math.random()).slice(0, 10);
        createHomeSection('Entdecke deine Bibliothek', randomAlbums.map(key => ({ original_folder: key, name: key === '.' ? 'Hauptverzeichnis' : key })), 'albumKey', 'original_folder', 'name');
    }
}


function populateRightPaneWithTracks(tracks, title, options = {}) {
    const { isError = false, isLoading = false, stats = null } = options;
    rightPaneContent.innerHTML = '';

    const header = document.createElement('h2');
    header.textContent = title;
    rightPaneContent.appendChild(header);

    if (stats) {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'ai-stats-info';
        statsDiv.innerHTML = `✨ KI-Statistik: 
            <span>Input Tokens: <strong>${stats.promptTokenCount || 0}</strong></span> | 
            <span>Output Tokens: <strong>${stats.candidatesTokenCount || 0}</strong></span>`;
        rightPaneContent.appendChild(statsDiv);
    }

    const trackList = document.createElement('ul');
    
    if (isLoading) {
        trackList.innerHTML = `<li class="track-list-item">Suche läuft, bitte warten...</li>`;
    } else if (isError) {
        trackList.innerHTML = `<li class="track-list-item" style="color: #ff6961;">${tracks}</li>`;
    } else if (!tracks || tracks.length === 0) {
        trackList.innerHTML = `<li class="track-list-item">Keine Titel für diese Anfrage gefunden.</li>`;
    } else {
        tracks.forEach(track => {
            const trackElement = createTrackListItem(track);
            trackList.appendChild(trackElement);
        });
    }
    
    rightPaneContent.appendChild(trackList);
}

function renderRadioPage() {
    rightPaneContent.innerHTML = '';
    const header = document.createElement('h2');
    header.textContent = 'Senderlisten';
    rightPaneContent.appendChild(header);
    const favStations = RADIO_STATIONS.filter(s => isFavoriteRadio(s.id));
    const otherStations = RADIO_STATIONS.filter(s => !isFavoriteRadio(s.id));
    if (favStations.length > 0) {
        const favHeader = document.createElement('h3');
        favHeader.textContent = 'Meine Sender';
        favHeader.style.marginTop = '20px';
        rightPaneContent.appendChild(favHeader);
        const favGrid = document.createElement('ul');
        favGrid.className = 'radio-grid';
        favStations.forEach(station => favGrid.appendChild(createRadioItem(station)));
        rightPaneContent.appendChild(favGrid);
    }
    const otherHeader = document.createElement('h3');
    otherHeader.textContent = 'Alle Sender';
    otherHeader.style.marginTop = '20px';
    rightPaneContent.appendChild(otherHeader);
    const radioGrid = document.createElement('ul');
    radioGrid.className = 'radio-grid';
    otherStations.forEach(station => radioGrid.appendChild(createRadioItem(station)));
    rightPaneContent.appendChild(radioGrid);
}

function createRadioItem(station) {
    const li = document.createElement('li');
    li.className = 'radio-list-item';
    li.dataset.id = station.id;
    if (station.id === currentPlayingRadioId) {
        li.classList.add('playing');
    }

    const logoContainer = document.createElement('div');
    logoContainer.className = 'radio-logo-container';

    const img = document.createElement('img');
    img.src = station.logoUrl;
    img.alt = station.name;
    img.className = 'radio-logo';

    const fallback = document.createElement('div');
    fallback.className = 'radio-logo-fallback';
    fallback.textContent = station.name.charAt(0).toUpperCase();

    img.addEventListener('error', () => {
        img.style.display = 'none';
        fallback.style.display = 'flex';
    });

    logoContainer.appendChild(img);
    logoContainer.appendChild(fallback);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'radio-name';
    nameDiv.textContent = station.name;

    const heartBtn = document.createElement('button');
    heartBtn.className = 'radio-favorite-btn';
    updateRadioHeartIcon(heartBtn, isFavoriteRadio(station.id));

    li.appendChild(logoContainer);
    li.appendChild(nameDiv);
    li.appendChild(heartBtn);

    return li;
}

async function renderArtistPage(artistName) {
    rightPaneContent.innerHTML = '';
    deselectAllLeftPaneItems();
    artistViewHeader.classList.add('selected');
    artistViewWrapper.classList.remove('hidden'); 
    
    lastArtistViewed = artistName; 
    artistViewHeader.textContent = artistName;

    const allTracksByArtist = Object.values(PLAYER_DATA.tracks).flat().filter(t => t.artist === artistName);

    if (allTracksByArtist.length === 0) {
        rightPaneContent.innerHTML = `<h2>Keine Titel für ${artistName} gefunden.</h2>`;
        return;
    }

    const artistHeader = document.createElement('div');
    artistHeader.id = 'artist-page-header';
    const artistImageContainer = document.createElement('div');
    artistImageContainer.className = 'artist-page-image';
    const artistNameHeading = document.createElement('h1');
    artistNameHeading.textContent = artistName;

    const firstTrackWithCover = allTracksByArtist.find(t => t.has_cover);
    if (firstTrackWithCover) {
        loadCoverForElement(artistImageContainer, firstTrackWithCover);
    } else {
        artistImageContainer.textContent = artistName.charAt(0).toUpperCase();
        artistImageContainer.style.fontSize = '4em';
    }
    
    const artistInfoContainer = document.createElement('div');
    artistInfoContainer.id = 'artist-info-container';
    artistInfoContainer.appendChild(artistNameHeading);
    
    artistHeader.appendChild(artistImageContainer);
    artistHeader.appendChild(artistInfoContainer);
    rightPaneContent.appendChild(artistHeader);
    
    const bioAndLinks = document.createElement('div');
    bioAndLinks.id = 'artist-bio-and-links';
    artistInfoContainer.appendChild(bioAndLinks);
    
    const bioContainer = document.createElement('div');
    bioContainer.id = 'artist-bio';
    bioContainer.textContent = 'Lade Biografie...';
    bioAndLinks.appendChild(bioContainer);

    try {
        const response = await fetch(`api/artist_info.php?artist=${encodeURIComponent(artistName)}`);
        const data = await response.json();
        if (data.bio) {
            bioContainer.textContent = data.bio;
        } else {
            bioContainer.textContent = 'Biografie nicht verfügbar.';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Künstlerinfo:', error);
        bioContainer.textContent = 'Fehler beim Laden der Biografie.';
    }
    
    const linksContainer = document.createElement('div');
    linksContainer.id = 'artist-links';
    
    const encodedArtistName = encodeURIComponent(artistName);
    
    const platforms = [
        { name: 'Spotify', url: `https://open.spotify.com/search/${encodedArtistName}`, icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.19 14.39c-.24.36-.68.48-1.04.24-2.85-1.74-6.42-2.12-10.51-.98-.42.07-.75-.24-.82-.66s.24-.75.66-.82c4.47-1.23 8.39-.81 11.51 1.05.35.22.47.68.25 1.04zm.8-2.6c-.29.44-.81.59-1.25.3-3.23-1.98-7.85-2.5-11.45-1.37-.51.16-.99-.17-1.14-.68s.17-.99.68-1.14c4.07-1.28 9.1-0.68 12.78 1.5.44.27.59.8.32 1.24zm.08-2.71c-3.82-2.28-9.94-2.43-13.32-1.34-.58.19-1.18-.15-1.37-.73s.15-1.18.73-1.37c3.83-1.23 10.54-1.05 14.88 1.5.53.31.73.95.42 1.48s-.95.73-1.48.42z"/></svg>' },
        { name: 'Amazon Music', url: `https://music.amazon.de/search/${encodedArtistName}`, icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.25-5.32c-.41.28-.6.78-.32 1.19.28.41.78.6 1.19.32l5-3.5c.38-.27.53-.76.33-1.16s-.68-.66-1.16-.43L12.5 14.5v-8c0-.41-.34-.75-.75-.75s-.75.34-.75.75v8.82z"/></svg>' },
        { name: 'YouTube Music', url: `https://music.youtube.com/search?q=${encodedArtistName}`, icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 13.5c-3.03 0-5.5-2.47-5.5-5.5s2.47-5.5 5.5-5.5 5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5zm-2.5-5.5l4-2.5v5l-4-2.5z"/></svg>' },
        { name: 'Google Bilder', url: `https://www.google.com/search?tbm=isch&q=${encodedArtistName}`, icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/></svg>'},
        { name: 'Instagram', url: `https://www.instagram.com/${artistName.toLowerCase().replace(/ /g, '')}/`, icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8A3.6 3.6 0 0 0 20 16.4V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm4.6 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm4.7-2.7a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>' }
    ];

    platforms.forEach(platform => {
        const link = document.createElement('a');
        link.href = platform.url;
        link.target = '_blank';
        link.className = 'artist-link-button';
        link.title = `${platform.name} durchsuchen`;
        link.innerHTML = platform.icon;
        linksContainer.appendChild(link);
    });
    
    bioAndLinks.appendChild(linksContainer);

    const topTracksSection = document.createElement('div');
    topTracksSection.className = 'artist-section';
    topTracksSection.innerHTML = '<h3>Top Titel</h3>';
    const trackList = document.createElement('ul');
    allTracksByArtist.slice(0, 10).forEach(track => {
        trackList.appendChild(createTrackListItem(track));
    });
    topTracksSection.appendChild(trackList);
    rightPaneContent.appendChild(topTracksSection);

    const albums = allTracksByArtist.reduce((acc, track) => {
        const albumKey = track.original_folder;
        if (!acc[albumKey]) {
            acc[albumKey] = { name: albumKey === '.' ? 'Hauptverzeichnis' : albumKey, key: albumKey, coverTrack: track };
        }
        return acc;
    }, {});

    if (Object.keys(albums).length > 0) {
        const albumsSection = document.createElement('div');
        albumsSection.className = 'artist-section';
        albumsSection.innerHTML = '<h3>Alben</h3>';
        const albumGrid = document.createElement('ul');
        albumGrid.className = 'home-row';
        Object.values(albums).forEach(album => {
            const listItem = document.createElement('li');
            listItem.className = 'home-row-item';
            listItem.dataset.albumKey = album.key;
            listItem.innerHTML = `<div class="cover-container">Lade...</div><div class="item-title">${album.name}</div>`;
            albumGrid.appendChild(listItem);
            loadCoverForElement(listItem, album.coverTrack);
        });
        albumsSection.appendChild(albumGrid);
        rightPaneContent.appendChild(albumsSection);
    }
}

function createTrackListItem(track) {
    const li = document.createElement('li');
    li.className = 'track-list-item';
    li.dataset.id = track.id;
    li.dataset.path = track.path;
    li.dataset.title = track.title;

    const coverHtml = track.thumbnail_url ? `<img class="list-track-cover" src="${track.thumbnail_url}" alt="Thumb">` : `<div class="list-track-cover">${track.has_cover ? 'Art' : '♪'}</div>`;
    
    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'track-info-wrapper';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'track-title';
    titleDiv.textContent = track.title; 
    infoWrapper.appendChild(titleDiv);
    
    const metaInfoParts = [];
    if (track.artist) metaInfoParts.push(track.artist);
    if (track.genre) metaInfoParts.push(track.genre);
    if (track.year) metaInfoParts.push(track.year);
    
    if (metaInfoParts.length > 0) {
        const metaInfoDiv = document.createElement('div');
        metaInfoDiv.className = 'track-meta-info';
        metaInfoDiv.textContent = metaInfoParts.join(' · ');
        infoWrapper.appendChild(metaInfoDiv);
    }

    const albumInfoSpan = document.createElement('span');
    albumInfoSpan.className = 'track-album-info';
    albumInfoSpan.textContent = track.original_folder ? `(Album: ${track.original_folder === '.' ? 'Hauptverzeichnis' : track.original_folder})` : '';

    li.innerHTML = coverHtml; 
    li.appendChild(infoWrapper);
    li.appendChild(albumInfoSpan);

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'track-actions';
    const queueBtn = document.createElement('button');
    queueBtn.className = 'queue-btn';

    const inQueue = playQueue.includes(track.id);
    queueBtn.title = inQueue ? 'Aus Warteschlange entfernen' : 'Zur Warteschlange hinzufügen';
    queueBtn.innerHTML = inQueue ?
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>` :
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2 12.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5z"/></svg>`;
    if (inQueue) queueBtn.style.color = '#1DB954';

    const heartBtn = document.createElement('button');
    heartBtn.className = 'favorite-btn';
    updateHeartIcon(heartBtn, isFavorite(track.id));
    actionsWrapper.appendChild(queueBtn);
    actionsWrapper.appendChild(heartBtn);
    li.appendChild(actionsWrapper);
    if (track.id === currentPlayingTrackId) li.classList.add('playing');
    return li;
}


function createHeartExplosion(element) { const rect = element.getBoundingClientRect();const originX = rect.left + rect.width / 2;const originY = rect.top + rect.height / 2;for (let i = 0; i < 10; i++) {const heart = document.createElement('span');heart.className = 'flying-heart';heart.textContent = '♥';heart.style.left = `${originX}px`;heart.style.top = `${originY}px`;const angle = Math.random() * Math.PI * 2;const distance = Math.random() * 50 + 50;const tx = Math.cos(angle) * distance;const ty = Math.sin(angle) * distance;heart.style.setProperty('--tx', `${tx}px`);heart.style.setProperty('--ty', `${ty}px`);document.body.appendChild(heart);setTimeout(() => {heart.remove();}, 1000);}}
function loadFavorites() { favorites = JSON.parse(localStorage.getItem('webPlayerFavorites') || '[]'); }
function saveFavorites() { localStorage.setItem('webPlayerFavorites', JSON.stringify(favorites)); }
function isFavorite(trackId) { return favorites.includes(trackId); }
function updateHeartIcon(btn, isFav) { if(btn) { btn.textContent = isFav ? '♥' : '♡'; btn.style.color = isFav ? '#1DB954' : '#b3b3b3'; } }
function toggleFavorite(trackId, heartIconElement) { const wasFavorite = isFavorite(trackId); if (wasFavorite) { const index = favorites.indexOf(trackId); if (index > -1) favorites.splice(index, 1); } else { favorites.push(trackId); createHeartExplosion(heartIconElement); } saveFavorites(); updateHeartIcon(heartIconElement, !wasFavorite); if (homeHeader.classList.contains('selected')) { renderHomePage(); } if (favoritesHeader.classList.contains('selected')) { favoritesHeader.click(); } updateFavoritesSection(); }
function getFavoriteTracksData() { return Object.values(PLAYER_DATA.tracks).flat().filter(track => isFavorite(track.id)).sort((a,b) => a.title.localeCompare(b.title)); }
function updateFavoritesSection() { loadFavorites(); if (favorites.length > 0) { favoritesWrapper.classList.remove('hidden'); } else { favoritesWrapper.classList.add('hidden'); if (favoritesHeader.classList.contains('selected')) { homeHeader.click(); } } }
function loadFavoriteRadios() { favoriteRadios = JSON.parse(localStorage.getItem('webPlayerFavoriteRadios') || '[]'); }
function saveFavoriteRadios() { localStorage.setItem('webPlayerFavoriteRadios', JSON.stringify(favoriteRadios)); }
function isFavoriteRadio(stationId) { return favoriteRadios.includes(stationId); }
function updateRadioHeartIcon(btn, isFav) { if(btn) { btn.textContent = isFav ? '♥' : '♡'; btn.style.color = isFav ? '#1DB954' : '#b3b3b3'; } }
function toggleFavoriteRadio(stationId, heartIconElement) { const wasFavorite = isFavoriteRadio(stationId); if (wasFavorite) { const index = favoriteRadios.indexOf(stationId); if (index > -1) favoriteRadios.splice(index, 1); } else { favoriteRadios.push(stationId); createHeartExplosion(heartIconElement); } saveFavoriteRadios(); updateRadioHeartIcon(heartIconElement, !wasFavorite); if (radioHeader.classList.contains('selected')) { renderRadioPage(); } }

function updateAlbumList() { albumListUl.innerHTML = ''; const sortedFolders = Object.keys(PLAYER_DATA.tracks).sort((a,b) => a.localeCompare(b)); sortedFolders.forEach(folder => { const li = document.createElement('li'); li.dataset.folderKey = folder; li.textContent = folder === '.' ? 'Hauptverzeichnis' : folder; albumListUl.appendChild(li); }); }
function updateGenreList() { genreListUl.innerHTML = ''; if(!PLAYER_DATA.genres || PLAYER_DATA.genres.length === 0) { document.getElementById('genre-list-wrapper').classList.add('hidden'); return; }; PLAYER_DATA.genres.forEach(genre => { const li = document.createElement('li'); li.dataset.genre = genre; li.textContent = genre; genreListUl.appendChild(li); }); }

function performLiveSearch(query) {
    if (!query) return { tracks: [], artists: [], albums: [] };

    const lowerQuery = query.toLowerCase();
    const results = {
        tracks: [],
        artists: new Set(),
        albums: new Set()
    };
    const allTracks = Object.values(PLAYER_DATA.tracks).flat();

    for (const track of allTracks) {
        if (track.title.toLowerCase().includes(lowerQuery) && results.tracks.length < 5) {
            results.tracks.push(track);
        }
        if (track.artist && track.artist.toLowerCase().includes(lowerQuery)) {
            results.artists.add(track.artist);
        }
        const albumName = track.original_folder === '.' ? 'Hauptverzeichnis' : track.original_folder;
        if (albumName && albumName.toLowerCase().includes(lowerQuery)) {
            results.albums.add(albumName);
        }
    }

    return {
        tracks: results.tracks,
        artists: Array.from(results.artists).slice(0, 3),
        albums: Array.from(results.albums).slice(0, 3)
    };
}

function displaySuggestions({ tracks, artists, albums }, query) {
    searchSuggestions.innerHTML = '';

    const hasLocalResults = tracks.length > 0 || artists.length > 0 || albums.length > 0;
    if (!query && !hasLocalResults) {
        searchSuggestions.classList.remove('visible');
        return;
    }

    let html = '';
    const highlight = (text) => text.replace(new RegExp(query, 'ig'), '<strong>$&</strong>');

    if (artists.length > 0) {
        html += `<div class="suggestion-category">Interpreten</div>`;
        artists.forEach(artist => {
            html += `
                <div class="suggestion-item" data-type="artist" data-value="${artist}">
                    <svg class="suggestion-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <div class="suggestion-text"><div class="title">${highlight(artist)}</div></div>
                </div>`;
        });
    }

    if (albums.length > 0) {
        html += `<div class="suggestion-category">Alben</div>`;
        albums.forEach(album => {
             html += `
                <div class="suggestion-item" data-type="album" data-value="${album}">
                    <svg class="suggestion-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
                    <div class="suggestion-text"><div class="title">${highlight(album)}</div></div>
                </div>`;
        });
    }

    if (tracks.length > 0) {
        html += `<div class="suggestion-category">Titel</div>`;
        tracks.forEach(track => {
            html += `
                <div class="suggestion-item" data-type="track" data-id="${track.id}">
                    <svg class="suggestion-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    <div class="suggestion-text">
                        <div class="title">${highlight(track.title)}</div>
                        <div class="subtitle">${track.artist || 'Unbekannt'}</div>
                    </div>
                </div>`;
        });
    }

    if (query) {
        html += `<div class="suggestion-category">Im Web suchen</div>`;
        html += `<div class="suggestion-item suggestion-item-external">`;
        const encodedQuery = encodeURIComponent(query);
        EXTERNAL_SEARCH_PLATFORMS.forEach(platform => {
             const finalUrl = platform.url + encodedQuery;
             html += `<a href="${finalUrl}" target="_blank" class="artist-link-button" title="${platform.name} nach '${query}' durchsuchen">${platform.icon}</a>`;
        });
        html += `</div>`;
    }

    searchSuggestions.innerHTML = html;
    searchSuggestions.classList.add('visible');
}


function performSearch(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    for (const folderKey in PLAYER_DATA.tracks) {
        PLAYER_DATA.tracks[folderKey].forEach(track => {
            const searchFields = [track.title, track.original_folder, track.artist, track.genre];
            const albumName = track.original_folder === '.' ? 'Hauptverzeichnis' : track.original_folder;
            if (
                track.title.toLowerCase().includes(lowerQuery) ||
                (albumName && albumName.toLowerCase().includes(lowerQuery)) ||
                (track.artist && track.artist.toLowerCase().includes(lowerQuery)) ||
                (track.genre && track.genre.toLowerCase().includes(lowerQuery))
            ) {
                 if (!results.some(t => t.id === track.id)) {
                    results.push(track);
                }
            }
        });
    }
    return results;
}

async function performAiSearch(query) {
    if (!geminiApiKey) {
        return { error: 'Gemini API Key ist nicht konfiguriert.' };
    }
    if (isAiSearching) return { tracks: searchResultsCache };

    isAiSearching = true;

    const allTracksSimple = Object.values(PLAYER_DATA.tracks).flat().map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        genre: t.genre,
        lyric_snippet: t.lyric_snippet
    }));

    const prompt = `Du bist ein KI-Musikexperte. Deine Aufgabe ist es, aus einer JSON-Liste von Songs diejenigen herauszufiltern, die am besten zur Anfrage des Nutzers passen.
Anfrage des Nutzers: "${query}"

Analysiere die Anfrage und finde passende Songs in der folgenden Liste. Berücksichtige dabei Titel, Künstler, Genre und, falls vorhanden, den Textschnipsel ('lyric_snippet'), um die Sprache oder das Thema zu erkennen.
Deine Antwort MUSS ausschließlich ein valides JSON-Array enthalten, das die "id"s der passenden Songs als Strings enthält. Gib KEINE einleitenden Sätze, Erklärungen, Markdown-Formatierungen (wie \`\`\`json) oder sonstigen Text aus. Wenn nichts passt, gib ein leeres Array [] zurück.

Beispiel für eine gültige Antwort: ["track-abc", "track-def"]

Song-Liste:
${JSON.stringify(allTracksSimple, null, 2)}`;

    lastAiPrompt = prompt;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const result = await response.json();
        lastAiResponse = result;

        console.groupCollapsed("KI-Kommunikation");
        console.log("Gesendeter Prompt:", lastAiPrompt);
        console.log("Roh-Antwort der KI:", lastAiResponse);
        console.groupEnd();

        if (!response.ok) {
            console.error('Gemini API Error:', result);
            return { error: `API-Fehler: ${result.error?.message || 'Unbekannter Fehler'}` };
        }
        
        const stats = result.usageMetadata || null;

        if (!result.candidates || !result.candidates[0].content.parts[0].text) {
             return { error: 'Ungültige Antwort von der KI erhalten.' };
        }
        const rawText = result.candidates[0].content.parts[0].text;
        const startIndex = rawText.indexOf('[');
        const endIndex = rawText.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
            console.error("AI did not return a parsable JSON array.", rawText);
            return { error: 'KI hat kein gültiges JSON-Array zurückgegeben.', stats };
        }

        const jsonString = rawText.substring(startIndex, endIndex + 1);
        const matchedIds = JSON.parse(jsonString);
        const matchedTracks = matchedIds.map(id => findTrackById(id)).filter(Boolean);
        return { tracks: matchedTracks, stats };

    } catch (error) {
        console.error("Fehler bei der KI-Suche:", error);
        lastAiResponse = { error: error.message };

        console.group("KI-Kommunikation (FEHLER)");
        console.log("Gesendeter Prompt:", lastAiPrompt);
        console.error("Fehlerdetails:", lastAiResponse);
        console.groupEnd();

        return { error: `Ein Fehler ist aufgetreten: ${error.message}` };
    } finally {
        isAiSearching = false;
    }
}

function findTrackById(trackId) { for (const folder in PLAYER_DATA.tracks) { const found = PLAYER_DATA.tracks[folder].find(track => track.id === trackId); if (found) return found; } return null; }
function getQueueTracksData() { return playQueue.map(findTrackById).filter(Boolean); }

function toggleQueue(trackId, buttonElement) {
    if (!trackId) return;
    const index = playQueue.indexOf(trackId);

    if (index > -1) {
        playQueue.splice(index, 1);
    } else {
        playQueue.push(trackId);
    }

    updateQueueSection();

    if (queueHeader.classList.contains('selected')) {
        queueHeader.click();
    }

    if (buttonElement) {
        const inQueue = playQueue.includes(trackId);
        buttonElement.title = inQueue ? 'Aus Warteschlange entfernen' : 'Zur Warteschlange hinzufügen';
        buttonElement.innerHTML = inQueue
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2 12.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5z"/></svg>`;
        buttonElement.style.color = inQueue ? '#1DB954' : '#b3b3b3';
    }
}

function updateQueueSection() { if (playQueue.length > 0) { queueWrapper.classList.remove('hidden'); queueHeader.textContent = `Warteschlange`; } else { queueWrapper.classList.add('hidden'); if (queueHeader.classList.contains('selected')) { homeHeader.click(); } } }


function clearArtistContext() {
    if (lastArtistViewed) {
        artistViewWrapper.classList.add('hidden');
        artistViewHeader.classList.remove('selected');
        lastArtistViewed = null;
    }
}

function deselectAllLeftPaneItems() {
    document.querySelectorAll('#home-header, #radio-header, #queue-header, #favorites-header, #album-list li, #genre-list li, #search-results-header, #artist-view-header')
      .forEach(el => el.classList.remove('selected'));
}


function updateSearchResultsSectionVisibility() {
    if (lastSearchQuery) {
        searchResultsWrapper.classList.remove('hidden');
    } else {
        searchResultsWrapper.classList.add('hidden');
        if (searchResultsHeader.classList.contains('selected')) {
           homeHeader.click();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('no-track-selected');
    loadFavorites();
    loadFavoriteRadios();
    playHistory = JSON.parse(localStorage.getItem('webPlayerHistory') || '[]');
    updateAlbumList();
    updateGenreList();
    updateQueueSection();
    updateFavoritesSection();
    updateSearchResultsSectionVisibility();

    const statsBtn = document.getElementById('stats-btn');
    const statsOverlay = document.getElementById('stats-overlay');
    const statsCloseBtn = document.getElementById('stats-close-btn');

    if (statsBtn && statsOverlay) {
        statsBtn.addEventListener('click', () => {
            statsOverlay.classList.remove('hidden');
        });
    }
    if (statsCloseBtn && statsOverlay) {
        statsCloseBtn.addEventListener('click', () => {
            statsOverlay.classList.add('hidden');
        });
    }
    if (statsOverlay) {
        statsOverlay.addEventListener('click', (e) => {
            if (e.target === statsOverlay) {
                statsOverlay.classList.add('hidden');
            }
        });
    }

    playPauseBtn.addEventListener('click', () => {
        if (!isVisualizerInitialized) {
            initVisualizer();
        }

        if (!audioPlayer.src) {
            nowPlayingDiv.textContent = 'Wähle einen Titel';
            artistSearchBtn.style.display = 'none';
            return;
        };
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    });

    audioPlayer.addEventListener('play', () => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        if (isVisualizerInitialized) {
           renderVisualizerFrame(); 
        }
        if (isLyricsVisible && !hasSyncedLyrics) {
            animateUnsyncedLyricsScroll();
        }
    });

    audioPlayer.addEventListener('pause', () => {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        if (lyricsScrollAnimationId) {
            cancelAnimationFrame(lyricsScrollAnimationId);
            lyricsScrollAnimationId = null;
        }
    });

    audioPlayer.addEventListener('ended', () => { if(currentPlayingRadioId) return; if(repeatMode === 'one') { audioPlayer.currentTime = 0; audioPlayer.play(); } else { playNextLogicalTrack(); } });
    audioPlayer.addEventListener('loadedmetadata', () => { if(currentPlayingRadioId) return; totalDurationEl.textContent = formatTime(audioPlayer.duration); timelineSlider.max = audioPlayer.duration; });

    audioPlayer.addEventListener('timeupdate', () => {
        if(currentPlayingRadioId) return;

        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        if (!isSeeking) {
            timelineSlider.value = audioPlayer.currentTime;
        }
        updateTimelineSliderVisual();
        updateSyncedLyrics();
    });

    timelineSlider.addEventListener('input', () => {
        isSeeking = true;
    });
    timelineSlider.addEventListener('change', () => {
        audioPlayer.currentTime = timelineSlider.value;
        isSeeking = false;
    });

    volumeSlider.addEventListener('input', () => { audioPlayer.volume = volumeSlider.value / 100; updateVolumeSliderVisual(); });
    document.getElementById('prev-track-btn').addEventListener('click', playPreviousLogicalTrack);
    document.getElementById('next-track-btn').addEventListener('click', playNextLogicalTrack);
    document.getElementById('shuffle-btn').addEventListener('click', (e) => { isShuffleActive = !isShuffleActive; e.currentTarget.style.color = isShuffleActive ? '#1DB954' : '#b3b3b3'; });
    repeatBtn.addEventListener('click', () => { if (repeatMode === 'off') { repeatMode = 'all'; repeatBtn.title = 'Alle wiederholen'; repeatIcon.style.display = 'block'; repeatIcon.style.color = '#1DB954'; repeatOneIcon.style.display = 'none'; } else if (repeatMode === 'all') { repeatMode = 'one'; repeatBtn.title = 'Einen wiederholen'; repeatIcon.style.display = 'none'; repeatOneIcon.style.display = 'block'; repeatOneIcon.style.color = '#1DB954'; } else { repeatMode = 'off'; repeatBtn.title = 'Wiederholen aus'; repeatIcon.style.display = 'block'; repeatIcon.style.color = '#b3b3b3'; repeatOneIcon.style.display = 'none'; } });

    
    homeHeader.addEventListener('click', () => {
        deselectAllLeftPaneItems();
        homeHeader.classList.add('selected');
        renderHomePage();
    });
    radioHeader.addEventListener('click', () => {
        deselectAllLeftPaneItems();
        radioHeader.classList.add('selected');
        renderRadioPage();
    });
    queueHeader.addEventListener('click', () => {
        deselectAllLeftPaneItems();
        queueHeader.classList.add('selected');
        const tracks = getQueueTracksData();
        populateRightPaneWithTracks(tracks, `${tracks.length} Titel in der Warteschlange`);
    });
    favoritesHeader.addEventListener('click', () => {
        deselectAllLeftPaneItems();
        favoritesHeader.classList.add('selected');
        const tracks = getFavoriteTracksData();
        populateRightPaneWithTracks(tracks, `${tracks.length} Favoriten`);
    });

    genreListUl.addEventListener('click', e => {
        const li = e.target.closest('li[data-genre]');
        if (!li) return;
        deselectAllLeftPaneItems();
        li.classList.add('selected');
        const genre = li.dataset.genre;
        const tracks = Object.values(PLAYER_DATA.tracks).flat().filter(track => track.genre === genre).sort((a,b) => a.title.localeCompare(b.title));
        populateRightPaneWithTracks(tracks, `Genre: ${genre}`);
    });
    albumListUl.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-folder-key]');
        if (!li) return;
        deselectAllLeftPaneItems();
        li.classList.add('selected');
        const albumKey = li.dataset.folderKey;
        populateRightPaneWithTracks(PLAYER_DATA.tracks[albumKey], albumKey === '.' ? 'Hauptverzeichnis' : albumKey);
    });

    artistViewHeader.addEventListener('click', (e) => {
        if (lastArtistViewed) {
            renderArtistPage(lastArtistViewed);
        }
    });

    searchResultsHeader.addEventListener('click', () => {
        deselectAllLeftPaneItems();
        searchResultsHeader.classList.add('selected');
        const title = lastSearchWasAi ? `KI-Ergebnisse für: "${lastSearchQuery}"` : `Suchergebnisse für: "${lastSearchQuery}"`;
        populateRightPaneWithTracks(searchResultsCache, title);
    });

    rightPaneContent.addEventListener('click', e => {
        const trackListItem = e.target.closest('.track-list-item');
        const homeItemTrack = e.target.closest('.home-row-item[data-track-id]');
        const homeItemAlbum = e.target.closest('.home-row-item[data-album-key]');
        const homeItemArtist = e.target.closest('.home-row-item[data-artist-name]');
        const radioListItem = e.target.closest('.radio-list-item');
        const artistPageAlbum = e.target.closest('#right-pane-content .home-row-item[data-album-key]');

        if(e.target.closest('.radio-favorite-btn')) { const stationId = e.target.closest('.radio-list-item').dataset.id; toggleFavoriteRadio(stationId, e.target.closest('.radio-favorite-btn')); return; }
        if (trackListItem) {
            if (e.target.closest('.favorite-btn')) {
                toggleFavorite(trackListItem.dataset.id, e.target.closest('.favorite-btn'));
                return;
            }
            if (e.target.closest('.queue-btn')) {
                toggleQueue(trackListItem.dataset.id, e.target.closest('.queue-btn'));
                return;
            }
            playTrack(findTrackById(trackListItem.dataset.id));
        } else if (homeItemTrack) { 
            navigateToTrackAndPlay(homeItemTrack.dataset.trackId);
        } else if (homeItemAlbum) { document.querySelector(`#album-list li[data-folder-key="${homeItemAlbum.dataset.albumKey}"]`)?.click();
        } else if (artistPageAlbum) { document.querySelector(`#album-list li[data-folder-key="${artistPageAlbum.dataset.albumKey}"]`)?.click();
        } else if (homeItemArtist) {
            renderArtistPage(homeItemArtist.dataset.artistName);
        } else if (radioListItem) { 
            const station = RADIO_STATIONS.find(s => s.id === radioListItem.dataset.id); 
            if(station) playRadioStation(station); 
        }
    });

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (query === "" || isAiSearching) return;

        lastSearchQuery = query;
        deselectAllLeftPaneItems();
        searchResultsHeader.classList.add('selected');
        updateSearchResultsSectionVisibility();

        if (isAiSearchActive) {
            populateRightPaneWithTracks([], 'KI-Anfrage gestartet', { isLoading: true });
            aiSearchToggle.classList.add('searching');
            try {
                const aiResult = await performAiSearch(query);
                if (aiResult.error) {
                    populateRightPaneWithTracks(aiResult.error, 'Fehler bei der KI-Suche', { isError: true, stats: aiResult.stats });
                    searchResultsCache = [];
                } else {
                    const title = `KI-Ergebnisse für: "${query}"`;
                    populateRightPaneWithTracks(aiResult.tracks, title, { stats: aiResult.stats });
                    searchResultsCache = aiResult.tracks;
                    lastSearchWasAi = true;
                }
            } catch (e) {
                populateRightPaneWithTracks('Ein unerwarteter Fehler ist aufgetreten.', 'Fehler', { isError: true });
            } finally {
                aiSearchToggle.classList.remove('searching');
            }
        } else {
            const results = performSearch(query);
            const title = `Suchergebnisse für: "${query}"`;
            searchResultsCache = results;
            lastSearchWasAi = false;
            populateRightPaneWithTracks(results, title);
        }
    }

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
            searchSuggestions.classList.remove('visible');
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        searchClearBtn.style.display = query ? 'inline-block' : 'none';

        if (isAiSearchActive) {
             searchSuggestions.classList.remove('visible');
             return;
        }
        
        const results = performLiveSearch(query);
        displaySuggestions(results, query);
    });

    searchInput.addEventListener('focus', () => {
         const query = searchInput.value.trim();
         if (query.length > 1 && !isAiSearchActive) {
             searchSuggestions.classList.add('visible');
         }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            searchSuggestions.classList.remove('visible');
        }, 200);
    });

    searchSuggestions.addEventListener('mousedown', (e) => {
        if (e.target.closest('.suggestion-item-external')) {
            return;
        }
        e.preventDefault();
        const item = e.target.closest('.suggestion-item');
        if (!item) return;

        const { type, id, value } = item.dataset;
        searchSuggestions.classList.remove('visible');

        if (type === 'track') {
            navigateToTrackAndPlay(id);
            searchInput.value = '';
        } else if (type === 'album') {
            searchInput.value = value;
            handleSearch();
        } else if (type === 'artist') {
            searchInput.value = '';
            renderArtistPage(value);
        }

        if (searchInput.value.trim() === '') {
            searchClearBtn.style.display = 'none';
        }
    });


    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchResultsCache = [];
        lastSearchQuery = '';
        updateSearchResultsSectionVisibility();
        searchSuggestions.classList.remove('visible');
        if (searchResultsHeader.classList.contains('selected')) {
           homeHeader.click();
        }
    });

    aiSearchToggle.addEventListener('click', () => {
        isAiSearchActive = !isAiSearchActive;
        aiSearchToggle.classList.toggle('active', isAiSearchActive);
        searchInput.title = isAiSearchActive ? 'KI-Suche ist aktiv. Enter zum Suchen.' : 'Normale Suche ist aktiv. Enter zum Suchen.';
        searchInput.placeholder = isAiSearchActive ? '✨ Frage die KI...' : '🔍 Suchen...';
    });

    lyricsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lyricsToggleBtn.disabled) return;
        isLyricsVisible = !isLyricsVisible;
        lyricsContainer.classList.toggle('visible', isLyricsVisible);
        lyricsToggleBtn.classList.toggle('active', isLyricsVisible);
        lyricsToggleBtn.title = isLyricsVisible ? 'Visualizer anzeigen' : 'Songtext anzeigen';

        if (isLyricsVisible && !hasSyncedLyrics) {
            animateUnsyncedLyricsScroll();
        } else if (lyricsScrollAnimationId) {
            cancelAnimationFrame(lyricsScrollAnimationId);
            lyricsScrollAnimationId = null;
        }
        
        if (!isLyricsVisible) {
            renderVisualizerFrame();
        }
    });

    vizStyleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let currentIndex = vizStyles.indexOf(currentVizStyle);
        currentVizStyle = vizStyles[(currentIndex + 1) % vizStyles.length];
        vizStyleBtn.title = `Stil: ${currentVizStyle}`;
        if (isLyricsVisible) {
            isLyricsVisible = false;
            lyricsContainer.classList.remove('visible');
            lyricsToggleBtn.classList.remove('active');
            lyricsToggleBtn.title = 'Songtext anzeigen';
            if (lyricsScrollAnimationId) {
                cancelAnimationFrame(lyricsScrollAnimationId);
                lyricsScrollAnimationId = null;
            }
            renderVisualizerFrame();
        }
    });

    visualizerContainer.addEventListener('click', (e) => {
        if (e.target.closest('#player-view-controls')) return;
        if (!document.fullscreenElement) {
            visualizerContainer.requestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        visualizerContainer.classList.toggle('fullscreen', !!document.fullscreenElement)
    });
    
    currentCoverArtContainer.addEventListener('click', (e) => {
        if (e.target.closest('#artist-search-btn')) {
            return;
        }
        const img = document.getElementById('current-cover-art-image');
        if (img.style.display === 'block' && img.src && img.src !== '#') {
            zoomedCoverImage.src = img.src;
            coverZoomModal.classList.add('active');
        }
    });

    artistSearchBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        const artistName = e.currentTarget.dataset.artist;
        if (artistName) {
            renderArtistPage(artistName);
        }
    });

    coverZoomModal.addEventListener('click', (e) => { if (e.target === coverZoomModal) coverZoomModal.classList.remove('active'); });
    document.querySelectorAll('#album-list-wrapper .collapsible-header, #genre-list-wrapper .collapsible-header').forEach(header => { header.addEventListener('click', () => { header.classList.toggle('collapsed'); header.nextElementSibling.classList.toggle('collapsed'); }); });

    document.querySelectorAll('#album-list-wrapper .collapsible-header, #genre-list-wrapper .collapsible-header').forEach(header => { header.classList.add('collapsed'); header.nextElementSibling.classList.add('collapsed'); });
    homeHeader.click();
    updateVolumeSliderVisual();
    updateTimelineSliderVisual();
    searchInput.placeholder = '🔍 Suchen...';
    searchInput.title = 'Normale Suche ist aktiv. Enter zum Suchen.';
    lyricsToggleBtn.disabled = true;

});

