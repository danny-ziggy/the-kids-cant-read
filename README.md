# The Kids Can't Read

An illustrated, interactive feature: kids aren't reading. v6 argues it in three parts (Can't, Don't, Won't) and ends on what works. Built across chats from the project brief (claude/build-brief-v6.md).

Live preview (GitHub Pages): https://danny-ziggy.github.io/the-kids-cant-read/

## Layout
- `index.html`: the built page. One self-contained file; this is what gets hosted.
- `src/style.css`, `src/body.html`, `src/app.js`: edit these, then rebuild.
- `build.py`: inlines `src/` into `index.html` and writes the link-preview tags.
- `og.png`: the link-preview image (rebuild with `python3 tools/og.py`).
- `tools/`: screenshot and interaction checks (Playwright + Chrome), with the page's real fonts served locally.
- `legacy/v4/`, `legacy/v5/`: earlier source, for reference. Not built.

## Build and check
```
python3 build.py
cd tools && npm install && cd ..            # once: fetches the fonts for screenshots
python3 tools/test.py                       # taps every interactive with touch emulation; type-size, overflow, deep links
python3 tools/shoot.py tools/shots.json 1280,960,720,390        # all scenes
python3 tools/shoot.py tools/shots.json 390 17,18,19            # only shots whose names start with these
python3 tools/og.py                         # link-preview image
```
Screenshots land in `shots/` (ignored by git). No video embeds anywhere: the teachers are still cards linking to news coverage.
