# Flink Einmaleins

Einfache Android App zum privaten Üben des kleinen Einmaleins, vollständig offline und ohne Anmeldung.

Die aktuelle Weitergabeversion wird unter Releases als dauerhaft signierte APK veröffentlicht. Alte Versionen bis 1.2 sind Entwicklungsversionen und sollten nicht mehr verteilt werden.

## Funktionen

* Genau 20 Aufgaben pro Runde mit Faktoren 2 bis 9
* Jede Antwort führt weiter. Auswertung nach 20 Antworten
* Richtige und falsche Antworten, Trefferquote, Zeit und einzeln abrufbare Lösungen
* Gespeicherte Runden mit Fehlerfilter und allen 20 Antworten
* Zeitmesser bis einschließlich zwei Minuten grün, danach rot
* Lokale Hintergrundmusik, Applaus und gespeicherter Tonknopf
* Datenschutzinfo und Löschen der gespeicherten Ergebnisse

## Datenschutz und Sicherheit

Keine Berechtigungen für Internet, Kontakte, Fotos, Kamera, Mikrofon, Standort oder gemeinsamen Speicher. Keine Werbung und keine Analysefunktionen. Bis zu 500 Runden mit Datum, Zeit, Ergebnissen und Antworten sowie die Toneinstellung werden in privaten App Daten gespeichert. Automatische Sicherungen und Gerätekopien sind ausgeschlossen. Die App fragt keine personenbezogenen Angaben ab.

Release APKs sind nicht debugfähig. WebView Debugging, Dateizugriffe, fremde Navigation und Cookies sind abgeschaltet. Eine Content Security Policy beschränkt die Oberfläche auf mitgelieferte Dateien. Der private Signaturschlüssel ist NICHT im Repository, in APKs oder in GitHub Actions enthalten. Nur das öffentliche Prüfzertifikat liegt unter `release/`.

## Updates und Signierung

1. `versionCode` und `versionName` erhöhen und Code pushen.
2. GitHub Actions baut und prüft die unsignierte Release APK. Das Artefakt enthält auch die offiziellen SDK Signierwerkzeuge.
3. APK privat mit dem dauerhaft gesicherten Schlüssel signieren. Das Schlüsselarchiv niemals veröffentlichen.
4. Die geprüfte signierte APK unter `downloads/Flink-Einmaleins-VERSION.apk` committen.
5. GitHub Actions kontrolliert die Signatur, das Zertifikat, das kompilierte Manifest und den APK Inhalt gegen den eigenen Quellcodebuild. Nur bei Erfolg wird ein Release erstellt.

Für Versionen bis 1.2 ist eine einmalige Deinstallation nötig. Ab 1.3 muss derselbe private Schlüssel für alle Updates verwendet werden. Ohne diesen Schlüssel sind keine regulären Updates möglich.

## Prüfen

`node --test tests/*.test.cjs`

`gradle :app:assembleRelease :app:lintRelease`

`python scripts/verify_apk.py app/build/outputs/apk/release/app-release-unsigned.apk`

Voraussetzungen: JDK 17, Gradle 8.11.1, Android SDK 35. Es gibt keine Garantie vollständiger Sicherheit. Ein unabhängiger Penetrationstest und ein systematischer Gerätetest über unterschiedliche Hersteller liegen nicht vor.
