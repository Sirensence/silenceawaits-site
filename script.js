import {escapeHTML as esc, safeURL, coverURL, filterReleases, mergeCatalog, durationLabel, formatDate} from "./catalog.js";
const grid = document.querySelector("#release-grid");
const search = document.querySelector("#catalog-search");
const status = document.querySelector("#catalog-status");
const empty = document.querySelector("#catalog-empty");
const filters = [...document.querySelectorAll(".filter")];
let releases = [];
let selectedFormat = "all";

function spotifyURL(release) {
  if (release.bandcamp_only) return "";
  return safeURL(release.spotify_url,["open.spotify.com"]) || safeURL(release.spotify_search_url,["open.spotify.com"]) || `https://open.spotify.com/search/${encodeURIComponent(`Silence Awaits ${release.title}`)}`;
}
function tracksHTML(release) {
  if (!release.tracks?.length) return "";
  return `<details class="tracks"><summary>Track list (${release.tracks.length})</summary>${release.edition_note ? `<p class="edition-note">${esc(release.edition_note)}</p>` : ""}<ol class="track-list">${release.tracks.map((track,index) => {
    const url = release.bandcamp_only ? safeURL(release.bandcamp_url,["bandcamp.com"]) : safeURL(track.spotify_url,["open.spotify.com"]) || safeURL(track.spotify_search_url,["open.spotify.com"]) || `https://open.spotify.com/search/${encodeURIComponent(`Silence Awaits ${track.title}`)}`;
    const destination = release.bandcamp_only ? "view on Bandcamp" : track.spotify_url ? "listen on Spotify" : "search on Spotify";
    return `<li class="track"><span class="track-number">${String(track.track_number || index+1).padStart(2,"0")}</span><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(track.title)}: ${destination}">${esc(track.title)}${track.explicit ? '<span class="explicit-tag" aria-label="Explicit">E</span>' : ""}</a><span class="track-time">${durationLabel(track.duration_ms)}</span></li>`;
  }).join("")}</ol></details>`;
}
function renderRelease(release) {
  const spotify = spotifyURL(release);
  const bandcamp = safeURL(release.bandcamp_url,["bandcamp.com"]);
  const apple = safeURL(release.apple_music_url,["music.apple.com"]);
  const primary = spotify || bandcamp || apple;
  return `<article class="release-card"><a class="cover-link" href="${esc(primary)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(release.title)}: ${spotify ? "open in Spotify" : "view on Bandcamp"}"><img src="${esc(coverURL(release))}" alt="${esc(release.title)} cover" width="600" height="600" loading="lazy"><span class="cover-play" aria-hidden="true">↗</span></a><div class="release-meta"><span class="release-format">${esc(release.format || "Release")}</span><time datetime="${esc(release.release_date || "")}">${esc((release.release_date || "").slice(0,4))}</time></div><h3>${esc(release.title)}</h3>${release.description ? `<p class="release-description">${esc(release.description)}</p>` : ""}<div class="release-links">${release.bandcamp_only ? '<span class="bandcamp-tag">BANDCAMP ONLY</span>' : ""}${spotify ? `<a href="${esc(spotify)}" target="_blank" rel="noopener noreferrer">${release.spotify_url ? "Spotify" : "Search Spotify"} ↗</a>` : ""}${bandcamp ? `<a href="${esc(bandcamp)}" target="_blank" rel="noopener noreferrer">Bandcamp ↗</a>` : ""}${apple ? `<a href="${esc(apple)}" target="_blank" rel="noopener noreferrer">Apple Music ↗</a>` : ""}</div>${tracksHTML(release)}</article>`;
}
function render() {
  const shown = filterReleases(releases,search.value,selectedFormat);
  grid.innerHTML = shown.map(renderRelease).join("");
  status.textContent = shown.length === releases.length ? `${releases.length} releases · Newest first` : `${shown.length} of ${releases.length} releases`;
  empty.hidden = shown.length !== 0;
  grid.querySelectorAll("img").forEach(img => img.addEventListener("error",() => { if (img.dataset.fallback) return; img.dataset.fallback = "true"; img.src = "./assets/cover-placeholder.svg"; },{once:true}));
}
search.addEventListener("input",render);
for (const button of filters) button.addEventListener("click",() => {
  selectedFormat = button.dataset.format;
  for (const filter of filters) { const active = filter === button; filter.classList.toggle("active",active); filter.setAttribute("aria-pressed",String(active)); }
  render();
});
document.querySelector("#copyright-year").textContent = new Date().getFullYear();

async function readJSON(path) {
  const response = await fetch(path,{cache:"no-cache"});
  if (!response.ok) throw new Error(`Catalog returned ${response.status}.`);
  return response.json();
}
async function init() {
  try {
    const [automaticResult,curatedResult] = await Promise.allSettled([readJSON("./data/auto-catalog.json"),readJSON("./data/curated-releases.json")]);
    const automatic = automaticResult.status === "fulfilled" && automaticResult.value.schema_version === 2 && Array.isArray(automaticResult.value.releases) ? automaticResult.value : null;
    const curated = curatedResult.status === "fulfilled" && Array.isArray(curatedResult.value) ? curatedResult.value : [];
    releases = mergeCatalog(automatic,curated);
    if (!releases.length) throw new Error("Archive unavailable.");
    document.querySelector("#release-count").textContent = releases.length;
    if (!automatic) document.querySelector("#catalog-note").textContent = "The streaming feed could not be loaded. The saved Bandcamp archive is still available.";
    else if (!curated.length) document.querySelector("#catalog-note").textContent = "The Bandcamp archive could not be loaded. Streaming releases are shown below.";
    render();
    if (automatic) {
      const updated = new Date(automatic.updated_at);
      if (!Number.isNaN(updated.getTime())) document.querySelector("#catalog-note").append(` Last catalog change: ${new Intl.DateTimeFormat("en",{dateStyle:"long",timeZone:"America/Matamoros"}).format(updated)}.`);
    }
  } catch {
    status.textContent = "The archive is temporarily unavailable. Please use the Spotify and Bandcamp links above.";
    document.querySelector("#catalog-note").textContent = "No release data has been changed.";
  }
}
init();
