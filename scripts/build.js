var esbuild = require('esbuild');
var path = require('path');
var fs = require('fs');

var isWatch = process.argv.includes('--watch');

function bumpSwCache() {
  var swPath = path.join(__dirname, '..', 'sw.js');
  var now = new Date();
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  var stamp = '' + now.getFullYear()
    + pad(now.getMonth() + 1)
    + pad(now.getDate())
    + '_' + pad(now.getHours())
    + pad(now.getMinutes());
  var sw = fs.readFileSync(swPath, 'utf8');
  var updated = sw.replace(/AUTOBUMP|(\d{8}_\d{4})/, stamp);
  fs.writeFileSync(swPath, updated, 'utf8');
  console.log('SW cache bumped: massfinder-v3_' + stamp);
}

var options = {
  entryPoints: [path.join(__dirname, '..', 'src', 'app.js')],
  bundle: true,
  outfile: path.join(__dirname, '..', 'dist', 'app.min.js'),
  format: 'iife',
  target: ['es2017'],
  minify: !isWatch,
  sourcemap: isWatch,
  logLevel: 'info',
};

if (isWatch) {
  esbuild.context(options).then(function(ctx) {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(options).then(function() {
    console.log('Build complete: dist/app.min.js');
    bumpSwCache();
  });
}
