import esbuild from 'esbuild';
import {sassPlugin} from 'esbuild-sass-plugin'
import fs from 'fs';
import path from 'path';
import glob from 'glob';

let watch = process.argv.indexOf('--watch') !== -1;

copyAndWatchFiles([
    "template.json",
    "system.json",
    "lang/**/*.json",
    "assets/**/*.*",
    "templates/**/*.hbs"
], 'dist', watch);


(async () => {
    await esbuild.build({
        entryPoints: [
            'src/init.ts',
            "templates/style.scss",
        ],
        loader: {'.hbs': 'default'},
        bundle: true,
        minify: true,
        sourcemap: true,
        logLevel: "info",
        target: ['es6'],
        watch: watch,
        outdir: 'dist',
        plugins: [
            sassPlugin(),
        ]
    })
})();


function copyAndWatchFiles(filesPatterns, targetDirectory, watch) {
    for (let filesPattern of filesPatterns) {
        for (let file of glob(filesPattern, {sync: true})) {
            const destination = path.join(targetDirectory, file);
            fs.cpSync(file, destination);
        }
    }

    if (watch) {
        watchFiles(filesPatterns, targetDirectory);
    }
}

function watchFiles(filesPatterns, targetDirectory) {
    let watchDirs = new Set();
    let watchers = [];

    for (let filesPattern of filesPatterns) {
        for (let file of glob(filesPattern, {sync: true})) {
            const destination = path.join(targetDirectory, file);
            watchers.push(fs.watch(file, {encoding: "utf8"})
                .on("change", () => {
                    console.info('Update ' + file + ' -> ' + destination);
                    if (fs.existsSync(file))
                        fs.cpSync(file, destination)
                    else
                        fs.rmSync(destination);
                }));
            watchDirs.add(path.dirname(file));
        }
    }

    for (let watchDir of watchDirs) {
        watchers.push(fs.watch(watchDir).on("change", (event, file) => {
            let changedPath = path.join(watchDir, file);
            if (fs.statSync(changedPath).isDirectory()) {
                console.log('Directory changed: ' + changedPath);
                for (let watcher of watchers) {
                    watcher.close();
                }
                watchers = [];
                copyAndWatchFiles(filesPatterns, targetDirectory);
            }
        }))
    }
}
