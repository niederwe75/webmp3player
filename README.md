# **Web-MP3-Player**

Ein einfacher, aber funktionsreicher, dateibasierter Web-Player für deine lokale Musiksammlung und Webradio-Streams, geschrieben in reinem PHP und Vanilla JavaScript.

## **✨ Features**

* **Dateibasiert**: Scannt dein lokales Musikverzeichnis und stellt es in einer übersichtlichen Oberfläche dar.  
* **Metadaten-Analyse**: Nutzt getID3, um automatisch Künstler, Genre, Jahr, Liedtexte und eingebettete Cover-Bilder zu extrahieren.  
* **Webradio-Streaming**: Integrierte Unterstützung für Internet-Radiosender.  
* **Thumbnail-Caching**: Erstellt und speichert verkleinerte Cover-Bilder für extrem schnelles Laden der Oberfläche.  
* **Statistik-Dashboard**: Detaillierte Analyse deiner Musikbibliothek mit Gesamtspielzeit, Top-Genres, Verteilung nach Jahrzehnt und mehr.  
* **KI-gestützte Suche**: Optionale semantische Suche, die natürliche Sprache versteht ("ruhige Songs für den Abend") mithilfe der Google Gemini API.  
* **Moderne Player-Features**: Warteschlange, Favoriten-System, Zufallswiedergabe und verschiedene Wiederholungsmodi.  
* **Audio-Visualizer**: Mehrere verschiedene grafische Visualisierungen, die sich in Echtzeit zum Takt der Musik bewegen.  
* **Künstler-Info-Seite**: Ruft bei Bedarf Künstlerbiografien und weiterführende Links zu Streaming-Plattformen ab.  
* **Responsive Design**: Saubere und anpassbare Oberfläche, die auf Desktops und Mobilgeräten funktioniert.

## **🛠️ Technischer Stack**

* **Backend**: PHP 8.0+  
* **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3  
* **Abhängigkeiten**: [getID3](https://github.com/JamesHeinrich/getID3/) via Composer  
* **API-Integration**: Google Gemini (optional für KI-Suche)

## **📋 Voraussetzungen**

* Ein Webserver wie Apache oder Nginx  
* PHP 8.0 oder neuer  
* Folgende PHP-Erweiterungen müssen aktiviert sein: gd, mbstring  
* [Composer](https://getcomposer.org/) zur Verwaltung der Abhängigkeiten

## **🚀 Installation**

1. Repository klonen  
   Klone dieses Repository in ein Verzeichnis auf deinem Webserver.  
2. Konfiguration erstellen  
   Kopiere die Konfigurationsvorlage. Diese Datei enthält alle wichtigen Pfade und Einstellungen.  
   cp config.php.template config.php

3. Konfiguration anpassen  
   Öffne die neu erstellte config.php mit einem Texteditor und passe die Einstellungen, insbesondere den Pfad zu deinem Musikverzeichnis ($musicDir), an deine Umgebung an.  
4. Abhängigkeiten installieren  
   Navigiere in das Projektverzeichnis und führe Composer aus, um die getID3-Bibliothek zu installieren.  
   composer install

5. Berechtigungen setzen  
   Der Webserver benötigt Schreibrechte für das Thumbnail-Cache-Verzeichnis.  
   \# Passe 'www-data' ggf. an den Benutzer deines Webservers an  
   sudo chown \-R www-data:www-data thumb\_cache  
   sudo chmod \-R 775 thumb\_cache

6. Webserver einrichten  
   Richte den Document Root deines Webservers auf das Hauptverzeichnis dieses Projekts (bzw. auf den api-Unterordner, falls du die Struktur getrennt hast).  
7. Fertig\!  
   Öffne die konfigurierte URL in deinem Browser. Der Player sollte deine Musikbibliothek scannen und anzeigen.

## **⚙️ Konfiguration**

Die wichtigsten Optionen in der config.php:

* $musicDir: Der absolute Pfad zu deinem Musikverzeichnis (z.B. /srv/music).  
* $fileTypes: Ein Array der zu suchenden Dateiendungen (z.B. \['\*.mp3', '\*.flac'\]).  
* $thumbnailCacheDir: Der absolute Pfad zum Cache-Ordner für Thumbnails.  
* $thumbnailPublicUrlBase: Die öffentliche URL, unter der der Cache-Ordner erreichbar ist (z.B. thumb\_cache).  
* $thumbnailSize: Die Kantenlänge der quadratischen Thumbnails in Pixeln.  
* $geminiApiKey: (Optional) Dein API-Schlüssel für die KI-Suche. Lasse ihn leer, um die Funktion zu deaktivieren.  
* $radioStations: Ein PHP-Array, das die Konfigurationen für die Webradio-Sender enthält.

## **📄 Lizenz**

Dieses Projekt steht unter der GNU General Public License v3.0. Siehe die LICENSE-Datei für weitere Details.
