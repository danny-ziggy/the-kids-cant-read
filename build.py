import pathlib
d=pathlib.Path(__file__).parent
css=(d/'src/style.css').read_text();body=(d/'src/body.html').read_text();js=(d/'src/app.js').read_text()
html=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Kids Can't Read</title>
<meta name="description" content="Kids aren't reading. The weakest readers can't, almost everyone reads less for fun, and the people who could fix it have reasons not to. An illustrated feature.">
<meta property="og:type" content="article">
<meta property="og:title" content="The Kids Can't Read">
<meta property="og:description" content="Kids aren't reading. An illustrated feature on who can't, who doesn't, who won't fix it, and what works.">
<meta property="og:url" content="https://danny-ziggy.github.io/the-kids-cant-read/">
<meta property="og:image" content="https://danny-ziggy.github.io/the-kids-cant-read/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The title The Kids Can't Read, half in an invented alphabet, above the line Kids aren't reading.">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&display=swap">
<style>
{css}
</style>
</head>
<body id="top">
{body}
<script>
{js}
</script>
</body>
</html>
'''
(d/"index.html").write_text(html)
print(len(html), 'bytes')
