require('esbuild').build({
    entryPoints: [`./csm.js`],
    format: 'cjs', // 'iife',
    bundle: true,
    minify: true,
    // sourcemap: true,
    globalName: 'csm',
    outfile: `bundlers/csm.min.js`,
    target: ['esnext'],
}).catch(() => process.exit(1))