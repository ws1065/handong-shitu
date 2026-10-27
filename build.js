const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

let html = read('index.html');
const css = read('css/style.css');
const js = [read('js/data.js'), read('js/scenes.js'), read('js/game.js')].join('\n');

html = html.replace(
  /<link rel="stylesheet" href="css\/style.css">/,
  () => '<style>\n' + css + '\n</style>'
);
html = html.replace(
  /<script src="js\/data.js"><\/script>\s*<script src="js\/scenes.js"><\/script>\s*<script src="js\/game.js"><\/script>/,
  () => '<script>\n' + js + '\n</script>'
);

fs.writeFileSync(path.join(root, '汉东仕途.html'), html);
console.log('已生成 汉东仕途.html（' + Buffer.byteLength(html) + ' 字节）');
