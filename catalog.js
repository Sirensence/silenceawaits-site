export function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
export function safeURL(value, allowedHosts) {
  try { const url = new URL(String(value)); if (url.protocol !== "https:") return "";
    if (allowedHosts && !allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return "";
    return url.href;
  } catch { return ""; }
}
export function coverURL(release) {
  return /^assets\/covers\/[a-z0-9-]+\.jpg$/.test(release.cover_local || "") ? `./${release.cover_local}` : safeURL(release.cover_url, ["mzstatic.com","bcbits.com"]) || "./assets/cover-placeholder.svg";
}
export function filterReleases(releases, query = "", format = "all") {
  const search = normalize(query);
  return releases.filter(r => (format === "all" || r.format === format) && (!search || normalize([r.title,...(r.tracks || []).map(t => t.title)].join(" ")).includes(search)));
}
export function mergeCatalog(automatic, curated) {
  const incoming = (automatic?.releases || []).filter(r => r.artist === "Silence Awaits" && r.source_id && r.title);
  const merged = new Map(incoming.map(r => [r.source_id,{...r}]));
  for (const entry of curated.filter(r => r.artist === "Silence Awaits" && r.source_id && r.title)) {
    const found = incoming.find(r => r.source_id === entry.source_id || normalize(r.title) === normalize(entry.title));
    const r = found ? {...found,...entry,source_id:found.source_id,tracks:found.tracks, total_tracks:found.total_tracks,bandcamp_only:entry.bandcamp_only && !found.apple_collection_id} : {...entry};
    merged.set(r.source_id,r);
  }
  return [...merged.values()].sort((a,b) => (b.release_date || "").localeCompare(a.release_date || "") || a.title.localeCompare(b.title,"en"));
}
export function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  return new Intl.DateTimeFormat("en",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(`${value}T12:00:00Z`));
}
export function durationLabel(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,"0")}`;
}
export function totalTracks(releases) { return releases.reduce((sum,r) => sum + (Number(r.total_tracks) || r.tracks?.length || 0),0); }
