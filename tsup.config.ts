import { defineConfig } from 'tsup'

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/query/index.ts',
    ],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    target: 'es2018',
    external:["react"],
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    // esbuildOptions(options) {
    //     options.drop = ['console', 'debugger']
    // }
});