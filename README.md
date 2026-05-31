Von Claude geschrieben!

OPNsense Network Time Widget
OPNsense Dashboard Widget für das Anzeigen der NTP-Netzwerkzeit, nach dem Vorbild des alten
Dashboard-Widgets aus OPNsense 24.1. Bringt eine kompakte „Netzwerkzeit"-Kachel
zurück, die mit dem neuen Dashboard (ab 24.7) aus dem Standardumfang verschwunden
ist.
Standardmäßig zeigt das Widget:

Server Time – die laufende, NTP-synchronisierte Uhrzeit der Firewall
Sync Source – die aktive Gegenstelle (Peer), mit der synchronisiert wird
Stratum – das Stratum dieser Quelle
Ref-ID – die Referenz-ID dieser Quelle

Hintergrund
Mit dem Dashboard-Rewrite in 24.7 wurde das ursprüngliche Netzwerkzeit-Widget
entfernt und nie ersetzt. Dieses Widget bildet die gewohnte Anzeige aus 24.1 nach
und nutzt dafür ausschließlich vorhandene API-Endpunkte – es ist keine
Modifikation am Core nötig.
Kompatibilität

OPNsense mit dem neuen Dashboard (24.7 und neuer)
Getestet auf 26.1.8 / FreeBSD 14.3

Funktionsweise

Server Time kommt aus /api/diagnostics/system/system_time (derselbe
Endpunkt, den auch „System Information" nutzt). Die Uhrzeit wird direkt aus dem
datetime-String übernommen und sekündlich lokal weitergezählt, um eine
laufende Uhr ohne dauernde API-Aufrufe zu erhalten.
Sync Source / Stratum / Ref-ID kommen aus dem NTP-Status-Endpunkt. Aus der
Peer-Liste wird die aktive Gegenstelle ermittelt (Tally * bzw. „active"/
„sys peer"); ist keine eindeutig aktiv markiert, wird als Rückfall der
erreichbare Eintrag mit dem kleinsten Stratum verwendet (Pools/DNS ausgenommen).

Installation

NetworkTime.js nach /usr/local/opnsense/www/js/widgets/ kopieren.
NetworkTime.xml nach /usr/local/opnsense/www/js/widgets/Metadata/ kopieren.
Den NTP-Status-Endpunkt in NetworkTime.js eintragen (Konstante
NTP_STATUS_URL, siehe unten).
Dashboard im Browser hart neu laden (Strg+F5).
Dashboard → Bearbeiten (Stift) → „Widget hinzufügen" → Network Time.

NTP_STATUS_URL ermitteln
Den genauen Endpunkt der Statusseite (Dienste → Netzwerkzeit → Status) findest du
auf der Box mit:
grep -rhoE "/api/[A-Za-z0-9_/]+" /usr/local/opnsense/mvc/app/views /usr/local/opnsense/mvc/app/controllers 2>/dev/null | grep -i ntp | sort -u
Den passenden Eintrag oben in NetworkTime.js setzen, z. B.:
jsconst NTP_STATUS_URL = '/api/ntpd/service/status';
Solange die Konstante leer ist, funktioniert „Server Time" trotzdem; die
Peer-Zeilen zeigen dann —.
Wichtige Hinweise

Kein import der Basisklasse. Das Widget erbt von BaseTableWidget, die im
neuen Dashboard als globale Klasse geladen wird. Ein
import ... from "./BaseWidget.js" schlägt fehl („no export named default") –
die mitgelieferten Widgets importieren ihre Basisklasse ebenfalls nicht.
ajaxCall gibt ein Promise zurück: const data = await this.ajaxCall(url).
Firmware-Updates: Dateien unter /usr/local/opnsense/www/js/widgets/ und
die Metadata/ gehören zum Core und werden bei einem Firmware-Update
überschrieben. Für eine updatefeste Lösung lässt sich das Widget als eigenes
Plugin (os-...) paketieren.

Geplant

Optionale Detailspalten über die Widget-Einstellungen: Type, When, Poll, Reach,
Delay, Offset und Jitter (aus demselben Peer-Datensatz).

Dateien

NetworkTime.js – das Widget
NetworkTime.xml – Metadata-Eintrag (Titel/Übersetzungen)
