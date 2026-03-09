var esbuild = require('esbuild');
var path = require('path');

var isWatch = process.argv.includes('--watch');

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
  });
}
