<?php
// Startzeit für Ladezeitmessung
$startTime = microtime(true);

// Fehleranzeige aktivieren
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL & ~E_DEPRECATED); // Deprecated-Meldungen für diese Anfrage unterdrücken

// Konfiguration und Abhängigkeiten laden
require_once __DIR__ . '/config.php';
$autoload = __DIR__ . '/vendor/autoload.php';

if (!file_exists($autoload)) {
    die('Autoload-Datei nicht gefunden: ' . htmlspecialchars($autoload) . '. Bitte Composer ausführen: `composer install`');
}
require $autoload;

if (!class_exists('getID3')) {
    die('Klasse getID3 nicht gefunden. Bitte überprüfe, ob getID3 via Composer korrekt installiert ist.');
}
$getID3 = new getID3();

// Hilfsfunktion zum Formatieren der Laufzeit (FEHLER KORRIGIERT)
function formatRuntime($seconds) {
    if ($seconds < 1) return "0s";
    // Explizite Umwandlung zu (int) um Deprecated-Warnungen zu verhindern
    $h = (int)floor($seconds / 3600);
    $m = (int)floor(($seconds % 3600) / 60);
    $s = (int)floor($seconds % 60);
    return sprintf('%d:%02d:%02d', $h, $m, $s);
}


// Prüfen, ob die GD-Bibliothek verfügbar ist und der Cache-Ordner beschreibbar ist
$gdAvailable = extension_loaded('gd') && function_exists('imagecreatefromstring');
$thumbnailCacheWritable = false;
if (!is_dir($thumbnailCacheDir)) {
    @mkdir($thumbnailCacheDir, 0755, true);
}
if (is_dir($thumbnailCacheDir) && is_writable($thumbnailCacheDir)) {
    $thumbnailCacheWritable = true;
}

function findMusicFiles($baseDir, $patterns) {
    $groupedFiles = [];
    $realBaseDir = realpath($baseDir);
    if (!$realBaseDir) return [];

    $baseWithSep = rtrim($realBaseDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($realBaseDir, RecursiveDirectoryIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);

    foreach ($iterator as $file) {
        if (!$file->isFile()) continue;
        foreach ($patterns as $pattern) {
            $regex = '/' . str_replace(['*', '?'], ['.*', '.?'], preg_quote($pattern, '/')) . '$/i';
            if (preg_match($regex, $file->getFilename())) {
                $path = $file->getPathname();
                $dir = $file->getPath();
                $fileNameWithoutExtension = preg_replace('/\\.[mM][pP]3$/', '', $file->getFilename());

                $relative = '.';
                if ($dir !== $realBaseDir && strpos($dir, $baseWithSep) === 0) {
                    $relative = substr($dir, strlen($baseWithSep));
                }

                $groupedFiles[$relative][] = ['path' => $path, 'title' => $fileNameWithoutExtension];
                break;
            }
        }
    }
    uksort($groupedFiles, function($a, $b) {
        if ($a === '.') return -1;
        if ($b === '.') return 1;
        return strcasecmp($a, $b);
    });
    foreach ($groupedFiles as &$tracksInFolder) {
        usort($tracksInFolder, function($a, $b) {
            return strcasecmp($a['title'], $b['title']);
        });
    }
    return $groupedFiles;
}

$tracksByFolder = is_dir($musicDir) && is_readable($musicDir) ? findMusicFiles($musicDir, $fileTypes) : [];
$error = '';
if (!is_dir($musicDir) || !is_readable($musicDir)) {
    $error = "Musikverzeichnis nicht gefunden: " . htmlspecialchars($musicDir);
} elseif (empty($tracksByFolder)) {
    $error = "Keine Musikdateien in " . htmlspecialchars($musicDir) . " gefunden (" . implode(', ', $fileTypes) . ").";
}

$criticalError = !empty($error) && empty($tracksByFolder);

if (!$gdAvailable) {
    $error .= ($error ? "<br>" : "") . "PHP GD-Bibliothek nicht verfügbar. Thumbnails können nicht erstellt werden.";
}
if ($gdAvailable && !$thumbnailCacheWritable && !$criticalError) {
    $error .= ($error ? "<br>" : "") . "Thumbnail-Cache Verzeichnis '" . htmlspecialchars($thumbnailCacheDir) . "' ist nicht beschreibbar.";
}

// Variablen für die Statistik initialisieren
$tracksDataForJs = []; $genreCounts = []; $totalTracks = 0; $totalAlbums = 0; $loadTime = 0; $topGenres = [];
$totalRuntime = 0; $totalBitrate = 0; $trackCountForBitrate = 0;
$shortestTrack = ['title' => 'N/A', 'length' => PHP_INT_MAX];
$longestTrack = ['title' => 'N/A', 'length' => 0];
$yearCounts = [];
$oldestTrack = ['title' => 'N/A', 'year' => date("Y") + 1];
$newestTrack = ['title' => 'N/A', 'year' => 0];


if (!$criticalError) {
    foreach ($tracksByFolder as $folderKey => $tracksArray) {
        $currentAlbumTracks = [];
        foreach ($tracksArray as $track) {
            $info = $getID3->analyze($track['path']);
            $hasCover = !empty($info['comments']['picture'][0]);

            // Genre
            $genre = !empty($info['tags']['id3v2']['genre'][0]) ? $info['tags']['id3v2']['genre'][0] : (!empty($info['tags']['id3v1']['genre'][0]) ? $info['tags']['id3v1']['genre'][0] : null);
            if ($genre) { if (!isset($genreCounts[$genre])) $genreCounts[$genre] = 0; $genreCounts[$genre]++; }
            
            // Jahr
            $year = !empty($info['tags']['id3v2']['year'][0]) ? (int)$info['tags']['id3v2']['year'][0] : (!empty($info['tags']['id3v1']['year'][0]) ? (int)$info['tags']['id3v1']['year'][0] : null);
            if ($year && $year > 1900) {
                $decade = floor($year / 10) * 10;
                if (!isset($yearCounts[$decade])) $yearCounts[$decade] = 0;
                $yearCounts[$decade]++;
                if ($year < $oldestTrack['year']) { $oldestTrack['year'] = $year; $oldestTrack['title'] = $track['title']; }
                if ($year > $newestTrack['year']) { $newestTrack['year'] = $year; $newestTrack['title'] = $track['title']; }
            }

            // Künstler
            $artist = null;
            if (!empty($info['tags']['id3v2']['artist'][0])) $artist = $info['tags']['id3v2']['artist'][0];
            elseif (!empty($info['tags']['id3v2']['band'][0])) $artist = $info['tags']['id3v2']['band'][0];
            elseif (!empty($info['tags']['id3v1']['artist'][0])) $artist = $info['tags']['id3v1']['artist'][0];
            $artist = $artist ? trim(mb_convert_encoding($artist, 'UTF-8', 'auto')) : null;

            // Spielzeit
            $playtime = $info['playtime_seconds'] ?? 0;
            if ($playtime > 0) {
                $totalRuntime += $playtime;
                if ($playtime < $shortestTrack['length']) { $shortestTrack['length'] = $playtime; $shortestTrack['title'] = $track['title']; }
                if ($playtime > $longestTrack['length']) { $longestTrack['length'] = $playtime; $longestTrack['title'] = $track['title']; }
            }

            // Bitrate
            if (isset($info['audio']['bitrate'])) { $totalBitrate += $info['audio']['bitrate']; $trackCountForBitrate++; }

            $full_lyrics = !empty($info['tags']['id3v2']['unsynchronised_lyric'][0]) ? $info['tags']['id3v2']['unsynchronised_lyric'][0] : null;
            $synced_lyrics = !empty($info['lyrics_synced']) ? $info['lyrics_synced'] : null;
            $lyric_snippet = $full_lyrics ? mb_substr(preg_replace('/\s+/', ' ', $full_lyrics), 0, 150) : null;

            $thumbnailUrl = null;
            if ($hasCover && $gdAvailable && $thumbnailCacheWritable) {
                $thumbFilename = md5($track['path']) . '.jpg';
                $thumbFilepath = $thumbnailCacheDir . DIRECTORY_SEPARATOR . $thumbFilename;
                if (!file_exists($thumbFilepath)) {
                    $coverPictureData = $info['comments']['picture'][0]['data'];
                    $sourceImage = @imagecreatefromstring($coverPictureData);
                    if ($sourceImage) {
                        $originalWidth = imagesx($sourceImage); $originalHeight = imagesy($sourceImage);
                        $thumbImage = imagecreatetruecolor($thumbnailSize, $thumbnailSize);
                        imagecopyresampled($thumbImage, $sourceImage, 0, 0, 0, 0, $thumbnailSize, $thumbnailSize, $originalWidth, $originalHeight);
                        if (imagejpeg($thumbImage, $thumbFilepath, 85)) $thumbnailUrl = $thumbnailPublicUrlBase . '/' . $thumbFilename;
                        imagedestroy($sourceImage); imagedestroy($thumbImage);
                    }
                } else {
                    $thumbnailUrl = $thumbnailPublicUrlBase . '/' . $thumbFilename;
                }
            }
            $currentAlbumTracks[] = ['path' => $track['path'], 'title' => $track['title'], 'has_cover' => $hasCover, 'id' => 'track-' . md5($track['path']), 'thumbnail_url' => $thumbnailUrl, 'original_folder' => $folderKey, 'genre' => $genre, 'year' => $year, 'artist' => $artist, 'lyric_snippet' => $lyric_snippet, 'full_lyrics' => $full_lyrics, 'synced_lyrics' => $synced_lyrics ];
        }
        $tracksDataForJs[$folderKey] = $currentAlbumTracks;
    }
    
    // Statistik berechnen
    $loadTime = microtime(true) - $startTime;
    foreach ($tracksDataForJs as $folder) $totalTracks += count($folder);
    $totalAlbums = count($tracksByFolder);
    arsort($genreCounts);
    $topGenres = array_slice($genreCounts, 0, 5, true);
    $allGenres = array_keys($genreCounts);
    sort($allGenres);
    $avgBitrate = $trackCountForBitrate > 0 ? round(($totalBitrate / $trackCountForBitrate) / 1000) : 0;
    ksort($yearCounts);

}
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web-Player</title>
    <link rel="stylesheet" href="assets/style.css">
    <style>
        :root { --thumbnail-size: <?php echo $thumbnailSize; ?>px; }
    </style>
</head>
<body>
    <button id="stats-btn" title="Statistiken anzeigen">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z"/>
        </svg>
    </button>
    <div id="stats-overlay" class="hidden">
        <div id="stats-content">
            <span id="stats-close-btn">×</span>
            <div class="peel-stats">
                <h3>Bibliotheks-Analyse</h3>
                <h4>Allgemein</h4>
                <p><strong>Gesamtspielzeit:</strong> <span><?php echo formatRuntime($totalRuntime); ?></span></p>
                <p><strong>Titel / Alben:</strong> <span><?php echo $totalTracks; ?> / <?php echo $totalAlbums; ?></span></p>
                <p><strong>Ø Titel pro Album:</strong> <span><?php echo $totalAlbums > 0 ? number_format($totalTracks / $totalAlbums, 1) : 0; ?></span></p>
                
                <h4>Extreme</h4>
                <p><strong>Kürzester Titel:</strong> <span><?php echo htmlspecialchars($shortestTrack['title']) . ' (' . formatRuntime($shortestTrack['length']) . ')'; ?></span></p>
                <p><strong>Längster Titel:</strong> <span><?php echo htmlspecialchars($longestTrack['title']) . ' (' . formatRuntime($longestTrack['length']) . ')'; ?></span></p>
                <p><strong>Ältester Titel:</strong> <span><?php echo htmlspecialchars($oldestTrack['title']) . ' (' . $oldestTrack['year'] . ')'; ?></span></p>
                <p><strong>Neuester Titel:</strong> <span><?php echo htmlspecialchars($newestTrack['title']) . ' (' . $newestTrack['year'] . ')'; ?></span></p>

                <h3>Technische Details</h3>
                <p><strong>Ø Bitrate:</strong> <span>~<?php echo $avgBitrate; ?> kbps</span></p>
                <p><strong>PHP Scan-Dauer:</strong> <span><?php echo number_format($loadTime, 4); ?>s</span></p>
                <p><strong>GD-Bibliothek / Cache:</strong> <span><?php echo $gdAvailable ? '✔️' : '❌'; ?> / <?php echo $thumbnailCacheWritable ? '✔️' : '❌'; ?></span></p>
            </div>
            
            <?php if (!empty($topGenres)): ?>
            <div class="chart-container">
                <h4>Top 5 Genres</h4>
                <svg viewBox="0 0 360 120" preserveAspectRatio="xMidYMid meet">
                    <?php
                        $maxCount = max($topGenres) > 0 ? max($topGenres) : 1;
                        $barY = 5; $barHeight = 20;
                        foreach($topGenres as $genre => $count) {
                            $barWidth = ($count / $maxCount) * 230;
                            echo "<text x='0' y='" . ($barY + $barHeight / 2) . "' dy='.3em' class='bar-label'>" . htmlspecialchars(substr($genre, 0, 15)) . "</text>";
                            echo "<rect class='bar' x='130' y='$barY' width='$barWidth' height='$barHeight' rx='3' style='fill:#1DB954;'></rect>";
                            echo "<text x='135' y='" . ($barY + $barHeight / 2) . "' dy='.3em' class='bar-value'>$count</text>";
                            $barY += $barHeight + 5;
                        }
                    ?>
                </svg>
            </div>
            <?php endif; ?>

            <?php if (!empty($yearCounts)): ?>
            <div class="chart-container">
                <h4>Titel nach Jahrzehnt</h4>
                <svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMid meet">
                    <?php
                        $maxCount = max($yearCounts) > 0 ? max($yearCounts) : 1;
                        $barY = 5; $barHeight = 20;
                        foreach($yearCounts as $decade => $count) {
                            if($decade < 1900) continue;
                            $barWidth = ($count / $maxCount) * 230;
                            echo "<text x='0' y='" . ($barY + $barHeight / 2) . "' dy='.3em' class='bar-label'>" . htmlspecialchars($decade) . "er</text>";
                            echo "<rect class='bar' x='130' y='$barY' width='$barWidth' height='$barHeight' rx='3' style='fill:#888;'></rect>";
                            echo "<text x='135' y='" . ($barY + $barHeight / 2) . "' dy='.3em' class='bar-value'>$count</text>";
                            $barY += $barHeight + 5;
                        }
                    ?>
                </svg>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <div id="cover-zoom-modal"> <img id="zoomed-cover-image" src="#" alt="Zoomed Cover Art"> </div>
    <div id="top-bar">
        <div id="logo-container">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" class="logo-bg"/><path d="M 35 25 L 35 75" class="logo-stroke-1"/><path d="M 50 35 L 50 65" class="logo-stroke-2"/><path d="M 65 20 L 65 80" class="logo-stroke-3"/></svg>
            <span>Web Player</span>
        </div>
        <div id="player-area">
            <audio id="audio-player" crossorigin="anonymous"></audio>
            <div id="custom-player-controls">
                <div id="visualizer-container">
                    <div id="lyrics-container"></div>
                    <canvas id="visualizer-canvas"></canvas>
                    <div id="player-view-controls">
                        <button id="lyrics-toggle-btn" title="Songtext anzeigen">🎤</button>
                        <button id="viz-style-btn" title="Visualizer-Stil wechseln">🎶</button>
                    </div>
                </div>
                <div id="now-playing-wrapper">
                    <div id="now-playing">Wähle einen Titel</div>
                </div>
                <div id="player-timeline-container">
                    <span id="current-time">0:00</span>
                    <input type="range" id="timeline-slider" value="0" min="0" max="100">
                    <span id="total-duration">0:00</span>
                </div>
                <div id="player-buttons-row">
                    <button id="shuffle-btn" class="player-btn" title="Zufallswiedergabe aus"><svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg></button>
                    <button id="repeat-btn" class="player-btn" title="Wiederholen aus"><svg id="repeat-icon" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg><svg id="repeat-one-icon" style="display:none;" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2h-1v-4h-2v4h-1v-5h4v5z"/></svg></button>
                    <button id="prev-track-btn" class="player-btn" title="Vorheriger Titel"><svg viewBox="0 0 24 24"><path d="M7 6h2v12H7zm3.5 6l8.5 6V6z"></path></svg></button>
                    <button id="play-pause-btn" class="player-btn" title="Abspielen"><svg id="play-icon" viewBox="0 0 24 24"><path d="M7 19V5l14 7-14 7z"></path></svg><svg id="pause-icon" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg></button>
                    <button id="next-track-btn" class="player-btn" title="Nächster Titel"><svg viewBox="0 0 24 24"><path d="M7 18l8.5-6L7 6v12zm10-12v12h2V6h-2z"></path></svg></button>
                    <div class="spacer"></div>
                    <div id="volume-control-container">
                        <button id="mute-btn" class="player-btn" title="Stumm"><svg id="volume-on-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg><svg id="volume-off-icon" viewBox="0 0 24 24" style="display:none;"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg></button>
                        <input type="range" id="volume-slider" value="75" min="0" max="100">
                    </div>
                </div>
            </div>
        </div>
        <div id="search-area">
            <div id="search-wrapper">
                <input type="text" id="search-input" placeholder="🔍 Suchen..." autocomplete="off">
                <div id="search-suggestions"></div>
            </div>
            <button id="ai-search-toggle" title="KI-Suche aktivieren">✨</button>
            <button id="search-clear-btn" title="Suche löschen" style="display:none;">×</button>
        </div>
    </div>
    <div id="main-content-wrapper">
        <?php if ($criticalError): ?>
            <div class="error-message" style="width:100%; flex-grow: 1;"><?php echo $error; ?></div>
        <?php else: ?>
            <div id="left-pane">
                <div id="lists-container">
                    <div id="home-wrapper" class="collapsible-section"><h2 id="home-header" class="collapsible-header">Home</h2></div>
                    <div id="radio-wrapper" class="collapsible-section"><h2 id="radio-header" class="collapsible-header">Radio</h2></div>
                    <div id="queue-wrapper" class="collapsible-section hidden"><h2 id="queue-header" class="collapsible-header">Warteschlange</h2></div>
                    <div id="favorites-wrapper" class="collapsible-section hidden"><h2 id="favorites-header" class="collapsible-header">Favoriten</h2></div>
                    <div id="search-results-wrapper" class="collapsible-section hidden"><h2 id="search-results-header" class="collapsible-header">Suchergebnisse</h2></div>
                    <div id="artist-view-wrapper" class="collapsible-section hidden"><h2 id="artist-view-header" class="collapsible-header">Interpreter</h2></div>
                    <div id="album-list-wrapper" class="collapsible-section"><h2 class="collapsible-header">Alben</h2><ul id="album-list" class="collapsible-content"></ul></div>
                    <div id="genre-list-wrapper" class="collapsible-section"><h2 class="collapsible-header">Genres</h2><ul id="genre-list" class="collapsible-content"></ul></div>
                </div>
                <div id="current-cover-art-container">
                    <img id="current-cover-art-image" src="#" alt="Aktuelles Cover">
                    <div id="current-cover-art-placeholder">Cover</div>
                    <a id="artist-search-btn" href="#" title="Künstlerinformationen anzeigen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                        </svg>
                    </a>
                </div>
            </div>
            <div id="right-pane"><div id="right-pane-content"></div></div>
        <?php endif; ?>
    </div>
    <?php if (!$criticalError): ?>
    <script>
        window.PLAYER_DATA = {
            tracks: <?php echo json_encode($tracksDataForJs, JSON_INVALID_UTF8_SUBSTITUTE); ?>,
            genres: <?php echo json_encode($allGenres, JSON_INVALID_UTF8_SUBSTITUTE); ?>,
            radioStations: <?php echo json_encode($radioStations, JSON_INVALID_UTF8_SUBSTITUTE); ?>,
            geminiApiKey: '<?php echo htmlspecialchars($geminiApiKey ?? ''); ?>'
        };
    </script>
    <script src="assets/main.js"></script>
    <?php endif; ?>
</body>
</html>
