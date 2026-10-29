# Flink Einmaleins

Einfache Android App für das kleine Einmaleins. Funktioniert vollständig offline und ohne Anmeldung. Keine Internetberechtigung, keine Werbung und keine externen Datenübertragungen.

## Funktionen

* Genau 20 zufällige Aufgaben von 1 × 1 bis 10 × 10 je Runde
* Jede bestätigte Antwort führt direkt zur nächsten Aufgabe
* Auswertung erst nach 20 Antworten: richtig, falsch, Trefferquote, Gesamtzeit und Lösungen zu den Fehlern
* Zeitmesser bis einschließlich zwei Minuten grün, danach rot
* Die fünf besten fehlerfreien Runden unter zwei Minuten und die letzten fünf Runden werden lokal gespeichert

## APK herunterladen

Nach einem erfolgreichen GitHub Actions Lauf steht unter Releases die Datei `Flink-Einmaleins.apk` bereit. Auf dem Android Gerät herunterladen und öffnen. Android kann dafür einmalig die Installation aus dieser Quelle abfragen.

Dies ist eine persönlich nutzbare Testversion mit Debugsignatur. Der Schlüssel wird im Bauprozess erzeugt. Spätere Builds können eine andere Signatur haben und dann eine Deinstallation der bisherigen Version erfordern, bei der gespeicherte Ergebnisse verloren gehen. Für dauerhafte Updates ist vor weiteren Veröffentlichungen ein privater, dauerhaft aufbewahrter Signaturschlüssel erforderlich.

## Projekt bauen

Voraussetzungen: JDK 17, Gradle 8.11.1 und Android SDK 35.

`gradle :app:assembleDebug :app:lintDebug`

Das GitHub Actions Verfahren richtet diese Werkzeuge automatisch ein. Der Nativeinstieg verwendet Android WebView mit lokalem WebViewAssetLoader. Die Weboberfläche befindet sich in `app/src/main/assets`.

## Prüfstand

Die Weboberfläche wurde mit einer vollständigen Runde einschließlich einer falschen Antwort überprüft. Automatisierte Logikprüfungen decken leere Eingabe, falsche Antwort, exakt 20 Aufgaben, gemischte und vollständig richtige beziehungsweise falsche Runden, Auswertung und Speicherung ab. Der Android Bau und Gerätetest stehen bis zum ersten erfolgreichen Workflow Lauf aus.
