# The Kids Can't Read

An illustrated, interactive feature: kids aren't reading. v5 is being built in two parts (see the project brief).

Live preview (GitHub Pages): https://danny-ziggy.github.io/the-kids-cant-read/

## Layout
- `index.html`: the built page. One self-contained file; this is what gets hosted.
- `src/style.css`, `src/body.html`, `src/app.js`: edit these, then rebuild.
- `build.py`: inlines `src/` into `index.html`.
- `tools/`: screenshot and interaction checks (Playwright + Chrome), with the page's real fonts served locally.

## Build and check
```
python3 build.py
cd tools && npm install && cd ..            # once: fetches the fonts for screenshots
python3 tools/shoot.py tools/shots.json 1280,960,720,390
python3 tools/sheet.py 390 6 0.5 sheet.png 01title0 02titlemid 03titleend
python3 tools/test.py
```
Screenshots land in `shots/` (ignored by git). No video embeds: the three teachers are still cards with links.

`legacy/v4/` holds the v4 source for reference while Acts II–IV are rebuilt. It is not part of the build.
