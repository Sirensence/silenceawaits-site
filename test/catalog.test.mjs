import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalize,escapeHTML,safeURL,coverURL,filterReleases,mergeCatalog,totalTracks,durationLabel} from "../catalog.js";
import {buildCatalog,cleanTitle,releaseFormat,mapTrack} from "../scripts/catalog-source.mjs";
const automatic = JSON.parse(await readFile(new URL("../data/auto-catalog.json",import.meta.url),"utf8"));
const curated = JSON.parse(await readFile(new URL("../data/curated-releases.json",import.meta.url),"utf8"));
const links = JSON.parse(await readFile(new URL("../data/manual-links.json",import.meta.url),"utf8"));
const source = {artist:"Silence Awaits",apple_artist_id:1704352820,spotify_artist_url:"https://open.spotify.com/artist/3EK53UBvaWYKspu3aKFgqw"};
const catalog = mergeCatalog(automatic,curated);

test("catalog contains only Silence Awaits and seven unique releases",() => {
  assert.ok(catalog.length >= 7);
  assert.ok(catalog.every(r => r.artist === "Silence Awaits"));
  assert.equal(new Set(catalog.map(r => r.source_id)).size,catalog.length);
  assert.ok(catalog.some(r => r.title === "The Last Days"));
  assert.ok(automatic.releases.every(r => r.tracks.length === r.total_tracks));
  assert.ok(totalTracks(catalog) >= 60);
});
test("Bandcamp-only demo is retained without false streaming links",() => {
  const demo = catalog.find(r => r.title === "The Sighting (Demo)");
  assert.equal(demo.bandcamp_only,true);
  assert.equal(demo.tracks.length,13);
  assert.equal(demo.spotify_url,undefined);
  assert.match(demo.bandcamp_url,/the-sighting-demo$/);
  const last = catalog.find(r => r.title === "The Last Days");
  assert.equal(last.tracks.length,4);
  assert.equal(last.bandcamp_tracks.length,3);
  assert.match(last.edition_note,/three tracks/);
});
test("filters cover demo editions and search individual songs",() => {
  assert.equal(filterReleases(catalog,"Chainsaw")[0].title,"The Sighting (Demo)");
  for (const format of ["Demo","Album","EP"]) {
    const matches = filterReleases(catalog,"",format);
    assert.ok(matches.length >= 2);
    assert.ok(matches.every(r => r.format === format));
  }
  assert.equal(filterReleases(catalog,"nothing-zz").length,0);
  assert.equal(normalize(" INVOCACIÓN "),"invocacion");
});
test("markup, URLs, local cover paths and durations are safe",() => {
  assert.equal(escapeHTML('<script a="x">&'),"&lt;script a=&quot;x&quot;&gt;&amp;");
  assert.equal(safeURL("javascript:alert(1)"),"");
  assert.equal(safeURL("https://open.spotify.com.evil.test/",["open.spotify.com"]),"");
  assert.equal(coverURL({cover_local:"../../private.jpg"}),"./assets/cover-placeholder.svg");
  assert.equal(durationLabel(193000),"3:13");
  assert.equal(cleanTitle("Human Dissection EP - Single"),"Human Dissection");
  assert.equal(releaseFormat({collectionName:"Two - Single",trackCount:2}),"Single");
});
test("new streaming releases are added while omitted releases are preserved",async() => {
  const fetcher = async url => new URL(url).searchParams.get("entity") === "album" ? {results:[{wrapperType:"artist",artistId:source.apple_artist_id},{wrapperType:"collection",artistId:source.apple_artist_id,collectionId:999,collectionName:"New Chapter - Single",trackCount:1,releaseDate:"2026-10-01T00:00:00Z"}]} : {results:[{wrapperType:"track",kind:"song",collectionId:999,trackId:1,trackName:"New Chapter",trackNumber:1,trackTimeMillis:150000}]};
  const next = await buildCatalog([source],links,automatic,{fetcher,pause:async()=>{},now:()=>"fixed"});
  assert.equal(next.releases.length,automatic.releases.length+1);
  assert.equal(mergeCatalog(next,curated).length,catalog.length+1);
  const added = next.releases.find(r => r.source_id === "apple:999");
  assert.equal(added.spotify_url,"");
  assert.match(added.spotify_search_url,/New%20Chapter/);
  const stable = await buildCatalog([source],links,next,{fetcher,pause:async()=>{},now:()=>"other"});
  assert.equal(stable.updated_at,"fixed");
});
test("wrong artist, empty feed and incomplete track lists fail without publishing",async() => {
  await assert.rejects(buildCatalog([{...source,artist:"Other"}],links,automatic),/únicamente/);
  await assert.rejects(buildCatalog([source],links,automatic,{fetcher:async()=>({results:[]}),pause:async()=>{}}),/identidad/);
  await assert.rejects(buildCatalog([source],links,automatic,{fetcher:async()=>({results:[{wrapperType:"artist",artistId:source.apple_artist_id}]}),pause:async()=>{}}),/no devolvió/);
  const fetcher = async url => new URL(url).searchParams.get("entity") === "album" ? {results:[{wrapperType:"artist",artistId:source.apple_artist_id},{wrapperType:"collection",artistId:source.apple_artist_id,collectionId:1,collectionName:"Incomplete",trackCount:2}]} : {results:[{wrapperType:"track",kind:"song",collectionId:1,trackId:1,trackName:"One",trackNumber:1}]};
  await assert.rejects(buildCatalog([source],links,automatic,{fetcher,pause:async()=>{}}),/incompleta/);
});
test("manual links match both track title and position",() => {
  const release={apple_collection_id:"1",artist:"Silence Awaits"};
  const manual={tracks:{"1":[{title:"A Song",track_number:2,spotify_url:"https://open.spotify.com/track/123"}]}};
  assert.equal(mapTrack({trackNumber:2,trackName:"Wrong"},release,manual).spotify_url,"");
  assert.match(mapTrack({trackNumber:2,trackName:"A Song"},release,manual).spotify_url,/track\/123/);
});
