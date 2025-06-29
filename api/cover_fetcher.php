<?php
ini_set('display_errors', 0);
error_reporting(0);
header('Content-Type: application/json');

// Konfiguration und Abhängigkeiten laden (Pfade angepasst)
require_once __DIR__ . '/../config.php';
$autoload = __DIR__ . '/../vendor/autoload.php';

if (!file_exists($autoload)) {
    http_response_code(500);
    exit(json_encode(['error' => 'Autoloader nicht gefunden.']));
}
require $autoload;

if (!class_exists('getID3')) {
    http_response_code(500);
    exit(json_encode(['error' => 'getID3-Klasse nicht gefunden.']));
}

if (isset($_GET['path'])) {
    $trackPath = $_GET['path'];

    // Sicherheitsprüfung
    $realMusicBaseDir = realpath($musicDir);
    $realTrackPath = realpath($trackPath);

    if (!$realTrackPath || !$realMusicBaseDir || strpos($realTrackPath, $realMusicBaseDir) !== 0) {
        http_response_code(403);
        exit(json_encode(['error' => 'Zugriff verweigert.']));
    }

    if (!file_exists($realTrackPath) || !is_readable($realTrackPath)) {
        http_response_code(404);
        exit(json_encode(['error' => 'Datei nicht gefunden.']));
    }

    try {
        $getID3 = new getID3();
        $info = $getID3->analyze($realTrackPath);

        $coverData = null;
        if (!empty($info['comments']['picture'][0])) {
            $picture = $info['comments']['picture'][0];
            $coverData = 'data:' . $picture['image_mime'] . ';base64,' . base64_encode($picture['data']);
        }
        
        echo json_encode(['coverData' => $coverData]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Fehler bei der Analyse der Datei.', 'details' => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Track-Pfad nicht spezifiziert.']);
}
?>

