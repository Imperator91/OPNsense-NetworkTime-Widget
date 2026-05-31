/*
 * NetworkTime.js - Netzwerkzeit-Widget für das neue OPNsense-Dashboard (ab 24.7)
 * Layout im Stil von 24.1: getrennte Zeilen fuer Server Time, Sync Source, Stratum und Ref-ID.
 *
 * Server Time: /api/diagnostics/system/system_time   (datetime-String, kein Parsing)
 * Peer-Infos:  /api/ntpd/service/status              (aktive Gegenstelle)
 */

const NTP_STATUS_URL = '/api/ntpd/service/status';

export default class NetworkTime extends BaseTableWidget {
    constructor(config) {
        super(config);
        this.tickTimeout = 1;        // Sekundentakt fuer die Uhr
        this.tickCount = 0;
        this.serverSeconds = null;   // Sekunden seit Mitternacht (lokal hochgezaehlt)
        this.peer = null;            // { source, stratum, refid }
    }

    getMarkup() {
        let $table = this.createTable('nt-table', { headerPosition: 'left' });
        return $('<div id="nt-container"></div>').append($table);
    }

    async onMarkupRendered() {
        await this._syncTime();
        await this._syncPeer();
        this._render();
    }

    async onWidgetTick() {
        this.tickCount = (this.tickCount + 1) % 10;
        if (this.tickCount === 0 || this.serverSeconds === null) {
            await this._syncTime();      // alle ~10s vom Server nachziehen
            await this._syncPeer();
        } else {
            this.serverSeconds = (this.serverSeconds + 1) % 86400;  // dazwischen lokal weiterticken
        }
        this._render();
    }

    async _syncTime() {
        try {
            const data = await this.ajaxCall('/api/diagnostics/system/system_time');
            const m = (data && data.datetime) ? String(data.datetime).match(/(\d{1,2}):(\d{2}):(\d{2})/) : null;
            if (m) this.serverSeconds = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
        } catch (e) { /* letzten Stand behalten */ }
    }

    async _syncPeer() {
        try {
            const data = await this.ajaxCall(NTP_STATUS_URL);
            const rows = data && (data.rows || data.response || data.peers || (Array.isArray(data) ? data : []));
            this.peer = this._pickActivePeer(rows || []);
        } catch (e) { /* peer bleibt null */ }
    }

    _pickActivePeer(rows) {
        const get = (r, keys) => { for (const k of keys) if (r[k] !== undefined && r[k] !== null) return r[k]; return ''; };
        const norm = rows.map(r => ({
            source:  String(get(r, ['server', 'remote', 'host', 'peer', 'name'])),
            refid:   String(get(r, ['refid', 'ref_id', 'refId'])),
            stratum: String(get(r, ['stratum', 'st'])),
            status:  String(get(r, ['status', 'condition', 'tally', 'state', 'mode'])).toLowerCase(),
        }));
        // 1) aktiv markierte Gegenstelle (Tally '*' / "active" / "sys peer" / dt. "aktive gegenstelle")
        let active = norm.find(p =>
            /\*/.test(p.status) ||
            /sys[\s._-]?peer/.test(p.status) ||
            /\bactive\b/.test(p.status) ||
            /aktiv/.test(p.status) ||
            /gegenstelle/.test(p.status)
        );
        // 2) sonst: erreichbarer Eintrag mit kleinstem Stratum (Pools/DNS ausgenommen)
        if (!active) {
            const cand = norm.filter(p => p.stratum && p.stratum !== '16' && !/pool|dns/.test(p.status));
            cand.sort((a, b) => (parseInt(a.stratum) || 99) - (parseInt(b.stratum) || 99));
            active = cand[0] || null;
        }
        return active;
    }

    _fmtClock() {
        if (this.serverSeconds === null) return '--:--:--';
        const s = this.serverSeconds, p = n => String(n).padStart(2, '0');
        return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
    }

    _render() {
        const dash = '\u2014';
        const rows = [
            ['Server Time', `${this._fmtClock()}`],
            ['Sync Source', this.peer && this.peer.source ? this.peer.source : dash],
            ['Stratum',     this.peer && this.peer.stratum ? this.peer.stratum : dash],
            ['Ref-ID',      this.peer && this.peer.refid ? this.peer.refid : dash],
        ];
        super.updateTable('nt-table', rows);
    }
}
