require('esbuild').build({
    entryPoints: [`./ui/components/index.js`],
    format: 'esm', // 'iife',
    bundle: true,
    // minify: true,
    // sourcemap: true,
    globalName: 'csm',
    outfile: `bundlers/CSMUI.js`,
    target: ['esnext'],
}).catch(() => process.exit(1))