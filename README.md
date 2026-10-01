# Silence Awaits

Official English-language site for Silence Awaits, the black metal, DSBM and dark ambient project of Alejandro Emmanuel Arroyo Vargas.

## Hosting

Static HTML, CSS and JavaScript, hosted on GitHub Pages from `main` / root. No framework, build step, paid hosting plan or Spotify Premium subscription is needed.

The intended domain is `silenceawaits.com`. The domain currently uses GoDaddy nameservers. **The DNS authority migration has not been performed:** it requires the owner's explicit approval because it can affect email and other domain services. No `CNAME` is committed until the domain can safely be connected.

## Automatic catalogue

- `.github/workflows/sync-releases.yml` checks the public Apple/iTunes MX feed every six hours, with a manual Run workflow option. GitHub scheduled jobs may be delayed.
- Only Apple artist `1704352820` / Silence Awaits is accepted.
- The script validates every complete track list before atomically updating `data/auto-catalog.json`.
- Temporarily omitted releases are preserved. Empty, incorrect or incomplete source responses stop the update without replacing the catalogue.
- A catalogue change is committed and a Pages build is requested with GitHub's built-in temporary workflow token. There are no stored API credentials.
- New releases appear when Apple/iTunes lists them. Spotify availability may differ. Known direct album links are in `data/manual-links.json`; otherwise new releases use accurately labelled Spotify search links.
- `data/curated-releases.json` preserves Bandcamp-only recordings, direct platform links, editorial descriptions and local original covers. Bandcamp-only additions need a curated entry; they are not discovered from the Apple feed.
- The featured record is an editorial selection, not an automatically changing claim about the latest release.

The Last Days has four tracks in its streaming edition and three in the current Bandcamp edition. The website distinguishes them. Release dates in streaming cards follow Apple/iTunes; the versions on Bandcamp can have a different publication date.

## Local verification

Requires Node.js 24 or later:

```sh
npm test
npm run sync
```

Serve the directory using an HTTP static server rather than opening `index.html` through `file://`, so catalogue fetches work normally.

## Content and credits

The biography is original English copy based on the creator's request, his label and his published release notes. All seven covers are the original artist-owned Bandcamp files, stored locally without edits. Content sources and edition notes are in [SOURCES.md](SOURCES.md).

Music, artwork and project identity remain the property of their respective rights holder. No licence to reuse the music or artwork is implied by a public source-code repository.
