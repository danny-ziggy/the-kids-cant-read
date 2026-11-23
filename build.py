import pathlib
d=pathlib.Path(__file__).parent
css=(d/'src/style.css').read_text();body=(d/'src/body.html').read_text();js=(d/'src/app.js').read_text()
html=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Kids Can't Read</title>
<meta name="description" content="A documentary feature in three acts about what's actually happening with American kids and reading.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..800;1,6..72,400..800&display=swap">
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
