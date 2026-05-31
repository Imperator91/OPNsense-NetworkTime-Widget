<h1 align="center">OPNsense Network Time Widget</h1>
<p align="center">
  Widget für das Anzeigen der NTP-Netzwerkzeit, nach dem Vorbild des alten
  Dashboard-Widgets aus OPNsense 24.1.<br>
  Bringt eine kompakte „Netzwerkzeit"-Kachel zurück, die mit dem neuen Dashboard
  (ab 24.7) aus dem Standardumfang verschwunden ist.
</p>
<p align="center">
  <img alt="OPNsense 24.7+" src="https://img.shields.io/badge/OPNsense-24.7%2B-d94f00">
  <img alt="Getestet 26.1.8" src="https://img.shields.io/badge/getestet-26.1.8-blue">
  <img alt="License BSD-2-Clause" src="https://img.shields.io/badge/license-BSD--2--Clause-green">
</p>
<p align="center">
  <img src="docs/screenshot.png" alt="Network Time Widget" width="320">
</p>
<hr>
<h2>Funktionen</h2>
<p>Standardmäßig zeigt das Widget:</p>
<table>
  <tr><td><b>Server Time</b></td><td>die laufende, NTP-synchronisierte Uhrzeit der Firewall</td></tr>
  <tr><td><b>Sync Source</b></td><td>die aktive Gegenstelle (Peer), mit der synchronisiert wird</td></tr>
  <tr><td><b>Stratum</b></td><td>das Stratum dieser Quelle</td></tr>
  <tr><td><b>Ref-ID</b></td><td>die Referenz-ID dieser Quelle</td></tr>
</table>
<h2>Hintergrund</h2>
<p>
  Mit dem Dashboard-Rewrite in 24.7 wurde das ursprüngliche Netzwerkzeit-Widget
  entfernt und nie ersetzt. Dieses Widget bildet die gewohnte Anzeige aus 24.1
  nach und nutzt dafür ausschließlich vorhandene API-Endpunkte &ndash; es ist
  keine Modifikation am Core nötig.
</p>
<h2>Kompatibilität</h2>
<ul>
  <li>OPNsense mit dem neuen Dashboard (24.7 und neuer)</li>
  <li>Getestet auf 26.1.8 / FreeBSD 14.3</li>
</ul>
<h2>Funktionsweise</h2>
<ul>
  <li>
    <b>Server Time</b> kommt aus <code>/api/diagnostics/system/system_time</code>
    (derselbe Endpunkt, den auch „System Information" nutzt). Die Uhrzeit wird
    direkt aus dem <code>datetime</code>-String übernommen und sekündlich lokal
    weitergezählt, um eine laufende Uhr ohne dauernde API-Aufrufe zu erhalten.
  </li>
  <li>
    <b>Sync Source / Stratum / Ref-ID</b> kommen aus dem NTP-Status-Endpunkt.
    Aus der Peer-Liste wird die aktive Gegenstelle ermittelt (Tally <code>*</code>
    bzw. „active"/„sys peer"); ist keine eindeutig aktiv markiert, wird als
    Rückfall der erreichbare Eintrag mit dem kleinsten Stratum verwendet
    (Pools/DNS ausgenommen).
  </li>
</ul>
<h2>Installation</h2>
<ol>
  <li><code>NetworkTime.js</code> nach <code>/usr/local/opnsense/www/js/widgets/</code> kopieren.</li>
  <li><code>NetworkTime.xml</code> nach <code>/usr/local/opnsense/www/js/widgets/Metadata/</code> kopieren.</li>
  <li>Den NTP-Status-Endpunkt in <code>NetworkTime.js</code> eintragen (Konstante <code>NTP_STATUS_URL</code>, siehe unten).</li>
  <li>Dashboard im Browser hart neu laden (<kbd>Strg</kbd> + <kbd>F5</kbd>).</li>
  <li>Dashboard &rarr; Bearbeiten (Stift) &rarr; „Widget hinzufügen" &rarr; <b>Network Time</b>.</li>
</ol>
<h3>NTP_STATUS_URL ermitteln</h3>
<p>
  Den genauen Endpunkt der Statusseite (Dienste &rarr; Netzwerkzeit &rarr; Status)
  findest du auf der Box mit:
</p>
<pre><code>grep -rhoE "/api/[A-Za-z0-9_/]+" /usr/local/opnsense/mvc/app/views /usr/local/opnsense/mvc/app/controllers 2&gt;/dev/null | grep -i ntp | sort -u</code></pre>
<p>Den passenden Eintrag oben in <code>NetworkTime.js</code> setzen, z.&nbsp;B.:</p>
<pre><code>const NTP_STATUS_URL = '/api/ntpd/service/status';</code></pre>
<p>
  Solange die Konstante leer ist, funktioniert „Server Time" trotzdem; die
  Peer-Zeilen zeigen dann <code>&mdash;</code>.
</p>
<h2>Wichtige Hinweise</h2>
<ul>
  <li>
    <b>Kein <code>import</code> der Basisklasse.</b> Das Widget erbt von
    <code>BaseTableWidget</code>, die im neuen Dashboard als globale Klasse
    geladen wird. Ein <code>import &hellip; from "./BaseWidget.js"</code> schlägt
    fehl („no export named default") &ndash; die mitgelieferten Widgets
    importieren ihre Basisklasse ebenfalls nicht.
  </li>
  <li>
    <code>ajaxCall</code> gibt ein Promise zurück:
    <code>const data = await this.ajaxCall(url)</code>.
  </li>
  <li>
    <b>Firmware-Updates:</b> Dateien unter
    <code>/usr/local/opnsense/www/js/widgets/</code> und die
    <code>Metadata/</code> gehören zum Core und werden bei einem Firmware-Update
    überschrieben. Für eine updatefeste Lösung lässt sich das Widget als eigenes
    Plugin (<code>os-&hellip;</code>) paketieren.
  </li>
</ul>
<h2>Geplant</h2>
<details>
  <summary>Optionale Detailspalten über die Widget-Einstellungen</summary>
  <br>
  Zuschaltbar: Type, When, Poll, Reach, Delay, Offset und Jitter &ndash; aus
  demselben Peer-Datensatz.
</details>
<h2>Dateien</h2>
<table>
  <tr><td><code>NetworkTime.js</code></td><td>das Widget</td></tr>
  <tr><td><code>NetworkTime.xml</code></td><td>Metadata-Eintrag (Titel/Übersetzungen)</td></tr>
</table>
<h2>Lizenz</h2>
<p>Empfohlen: BSD-2-Clause (wie OPNsense selbst). Bitte nach Bedarf anpassen.</p>
