import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("Human Dissection is the featured record and the main share image", () => {
  assert.match(html, /og:image[^>]+human-dissection\.jpg/);
  assert.match(html, /rel="preload"[^>]+human-dissection\.jpg/);
  const featured = html.split('id="latest"')[1].split('<section class="discography')[0];
  assert.match(featured, /Human<br><em>Dissection<\/em>/);
  assert.match(featured, /human-dissection\.jpg/);
  assert.match(featured, /0fv3Z07AHp7xe4BOPKVZmA/);
  assert.match(featured, /album\/human-dissection-ep/);
  assert.doesNotMatch(featured, /the-last-days/);
  assert.match(css, /\.hero-art\{background-image:[^}]+human-dissection\.jpg/);
  assert.match(css, /\.about-atmosphere\{background-image:[^}]+the-sighting\.jpg/);
  assert.doesNotMatch(css, /\.about-atmosphere\{background-image:[^}]+human-dissection\.jpg/);
});

test("Cover sizing overrides HTML dimensions and avoids cropping", () => {
  assert.match(css, /img\{height:auto\}/);
  assert.match(css, /\.cover-link\{width:100%;aspect-ratio:1 \/ 1\}/);
  assert.match(css, /\.cover-link img\{[^}]+height:100%;[^}]+object-fit:contain/);
  assert.match(css, /\.featured-art img\{[^}]+height:auto;[^}]+object-fit:contain/);
  assert.match(css, /\.release-card\{width:100%;max-width:280px/);
  assert.match(css, /\.cover-link:hover img\{transform:none\}/);
});
