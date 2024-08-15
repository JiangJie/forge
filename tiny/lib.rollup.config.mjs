import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
    input: 'lib.ts',
    plugins: [
        esbuild({
            target: 'esnext',
        }),
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        }),
        nodeResolve(),
        commonjs(),
    ],
    output: [
        {
            file: 'lib.js',
            format: 'esm',
            sourcemap: false,
        },
    ],
    treeshake: {
        unknownGlobalSideEffects: false,
        propertyReadSideEffects: false,
    },
};