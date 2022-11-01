require('esbuild').build({
    entryPoints: [`./csm.js`],
    format: 'esm', // 'iife',
    bundle: true,
    minify: true,
    // sourcemap: true,
    // splitting: true,
    globalName: 'csm',
    outfile: `bundlers/csm.js`,
    target: ['esnext']
}).catch(() => process.exit(1))