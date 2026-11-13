export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
export const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const shuffle = <T>(a: T[]) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pct = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 100);
export const pad2 = (n: number) => String(n).padStart(2, '0');
/** Local calendar day as an integer (days since 1970-01-01 in local time). */
export const dayNum = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
/** A Date to read with timeZone UTC: gives the local calendar day of a dayNum. */
export const dayDate = (d: number) => new Date(d * 86400000);
export const base = () => document.body.dataset.base || '/';
export const data = <T>(id: string): T => JSON.parse(document.getElementById(id)!.textContent!);
const LAYER: Record<string, string> = { PHY: 'phy', MAC: 'mac', RLC: 'rlc', PDCP: 'pdcp', SDAP: 'pdcp', RRC: 'rrc', NAS: 'nas', S1AP: 'ap', X2AP: 'ap', NGAP: 'ap', XNAP: 'ap', F1AP: 'ap' };
export const lcls = (l: string) => 'L-' + (LAYER[l.toUpperCase()] || 'x');
let tt: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t!.hidden = true; }, 2600);
}
/* Teaching-log highlighter: timestamps, [LAYER] tags, key=value pairs and test verdicts.
   It does not colour words like "reject" or "expired" on purpose: spotting the clue is the exercise. */
const LOG_RE = /(^\s*\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)|(\[[A-Za-z0-9_\/ -]{1,12}\])|\b([A-Za-z_][\w.]*)=([^\s,;]+)|\b(FAIL(?:ED)?|ERROR)\b|\b(PASS(?:ED)?)\b/g;
export function hlLog(line: string) {
  if (/^\s*\.{3}\s*$/.test(line)) return '<span class="lg-dim">' + esc(line) + '</span>';
  let out = '', last = 0, m: RegExpExecArray | null; LOG_RE.lastIndex = 0;
  while ((m = LOG_RE.exec(line))) {
    out += esc(line.slice(last, m.index));
    if (m[1]) out += '<span class="lg-ts">' + esc(m[1]) + '</span>';
    else if (m[2]) out += '<span class="lg-tag ' + lcls(m[2].slice(1, -1).trim()) + '">' + esc(m[2]) + '</span>';
    else if (m[3]) out += '<span class="lg-k">' + esc(m[3]) + '=</span>' + esc(m[4]);
    else if (m[5]) out += '<span class="lg-bad">' + esc(m[5]) + '</span>';
    else out += '<span class="lg-ok">' + esc(m[6]) + '</span>';
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last));
}
/** Small deterministic hash, for stable drawing jitter per card. */
export const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
