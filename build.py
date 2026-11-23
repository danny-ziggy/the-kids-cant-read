import pathlib
d=pathlib.Path(__file__).parent
css=(d/'src/style.css').read_text();body=(d/'src/body.html').read_text();js=(d/'src/app.js').read_text()
html=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Kids Can't Read</title>
<meta name="description" content="Kids aren't reading. An illustrated feature on what happened to American kids and reading.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&display=swap">
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
