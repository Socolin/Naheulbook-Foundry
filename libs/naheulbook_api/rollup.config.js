import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
export default {
    plugins: [
        commonjs(),
        json(),
        nodeResolve({
            mainFields: ['browser', 'es2015', 'module', 'jsnext:main', 'main'],
        }),
    ],
};
