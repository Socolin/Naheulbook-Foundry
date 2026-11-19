import esbuild from 'esbuild';
import {sassPlugin} from 'esbuild-sass-plugin'
import fs from 'fs';
import path from 'path';
import {globSync} from 'glob';

let watch = process.argv.indexOf('--watch') !== -1;

copyAndWatchFiles([
    {pattern: "system.json", remove: ''},
    {pattern: "lang/**/*.json", remove: ''},
    {pattern: "assets/**/*.*", remove: ''},
    {pattern: "src/ui/**/*.hbs", remove: 'src/'}
], 'dist', watch);


(async () => {
    const ctx = await esbuild.context({
        entryPoints: [
            'src/init.ts',
            'src/ui/style.scss',
        ],
        loader: {'.hbs': 'default'},
        bundle: true,
        minify: true,
        sourcemap: true,
        minifyIdentifiers: false,
        logLevel: "info",
        target: ['es2021'],
        outdir: 'dist',
        plugins: [
            sassPlugin(),
        ]
    });
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
})();


function copyAndWatchFiles(filesPatterns, targetDirectory, watch) {
    for (let filesPattern of filesPatterns) {
        for (let file of globSync(filesPattern.pattern)) {
            const destination = path.join(targetDirectory, file.replace(filesPattern.remove, ''));
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
        for (let file of globSync(filesPattern.pattern)) {
            const destination = path.join(targetDirectory, file.replace(filesPattern.remove, ''));
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
