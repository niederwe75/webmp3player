<?php
// Fehlerberichterstattung für die Entwicklung einschalten
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Pufferung deaktivieren, um den Stream direkt durchzuleiten
if (ob_get_level()) {
    ob_end_clean();
}

// Konfiguration laden, um Zugriff auf die Radiostationen zu haben (Pfad angepasst)
require_once __DIR__ . '/../config.php';

// --- WICHTIGE SICHERHEITSPRÜFUNG ---
$allowedStations = $radioStations; 

// Die ID der angeforderten Station aus der URL holen
$requestedId = $_GET['id'] ?? null;

if (!$requestedId) {
    http_response_code(400); // Bad Request
    exit('Stations-ID fehlt.');
}

// Die Stream-URL für die angeforderte ID finden
$streamUrl = null;
foreach ($allowedStations as $station) {
    if ($station['id'] === $requestedId) {
        $streamUrl = $station['streamUrl'];
        break;
    }
}

if (!$streamUrl) {
    http_response_code(403); // Forbidden
    exit('Ungültige oder nicht erlaubte Stations-ID.');
}


// --- STREAMING-LOGIK ---
header('Content-Type: audio/mpeg');
header('Access-Control-Allow-Origin: *'); 
header('X-Content-Type-Options: nosniff');
header('Content-Transfer-Encoding: binary');
header('Cache-Control: no-cache');
header('Pragma: no-cache');


$handle = fopen($streamUrl, 'rb');
if ($handle) {
    fpassthru($handle);
    fclose($handle);
} else {
    http_response_code(502); // Bad Gateway
    exit('Konnte den externen Stream nicht öffnen.');
}

exit;
?>

