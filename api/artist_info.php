<?php
// Set header to return JSON
header('Content-Type: application/json');

// Get artist name from query parameter
$artistName = $_GET['artist'] ?? '';

if (empty($artistName)) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Artist name is required.']);
    exit;
}

// Prepare the artist name for the URL
$encodedArtistName = rawurlencode($artistName);
$apiUrl = "https://de.wikipedia.org/api/rest_v1/page/summary/" . $encodedArtistName;

// Set up a stream context to send a User-Agent header (good practice for APIs)
$options = [
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: WebPlayer/1.0 (https://example.com; your-email@example.com)\r\n"
    ]
];
$context = stream_context_create($options);

// Fetch data from Wikipedia API
// Using file_get_contents with error suppression
$responseJson = @file_get_contents($apiUrl, false, $context);

// Check for errors
if ($responseJson === false) {
    http_response_code(502); // Bad Gateway
    echo json_encode(['error' => 'Could not fetch data from Wikipedia API. The artist might not exist or the service is down.']);
    exit;
}

// Decode the JSON response
$responseData = json_decode($responseJson, true);

// Check if the expected data is present
if (isset($responseData['extract'])) {
    // Return a simple JSON object with the biography
    echo json_encode(['bio' => $responseData['extract']]);
} else {
    // If the 'extract' key is not found, the page likely doesn't exist
    http_response_code(404); // Not Found
    echo json_encode(['bio' => null, 'error' => 'No summary found for this artist on Wikipedia.']);
}

