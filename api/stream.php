<?php
// Konfiguration laden (Pfad angepasst)
require_once __DIR__ . '/../config.php';

if (isset($_GET['path'])) {
    $filePath = urldecode($_GET['path']);

    // Sicherheitsprüfung
    $realMusicBaseDir = realpath($musicDir);
    $realFilePath = realpath($filePath);

    if ($realFilePath === false || $realMusicBaseDir === false || strpos($realFilePath, $realMusicBaseDir) !== 0) {
        http_response_code(403);
        exit("Zugriff verweigert.");
    }

    if (file_exists($realFilePath) && is_readable($realFilePath)) {
        $contentType = 'audio/mpeg'; // Standard für MP3

        header("Access-Control-Allow-Origin: *");
        header('Content-Type: ' . $contentType);
        header('Content-Length: ' . filesize($realFilePath));
        header('Accept-Ranges: bytes');

        readfile($realFilePath);
        exit;

    } else {
        http_response_code(404);
        exit("Datei nicht gefunden.");
    }
} else {
    http_response_code(400);
    exit("Kein Dateipfad angegeben.");
}
?>

