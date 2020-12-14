const fs = require('fs');
const {spawn} = require('child_process');

function incrementVersion(version, type) {
    const splitVersion = version.split('.');
    switch (type) {
        case 'patch':
            splitVersion[2] = +splitVersion[2] + 1
            break;
        case 'minor':
            splitVersion[1] = +splitVersion[1] + 1
            break;
        case 'major':
            splitVersion[0] = +splitVersion[0] + 1
            break;
    }
    return splitVersion.join('.');
}

let systemJson = fs.readFileSync('system.json').toString("utf-8");
let system = JSON.parse(systemJson);
let type = process.argv.slice(2)[0] || 'patch';
let newVersion = incrementVersion(system.version, type);
system.download = system.download.replace(system.version, newVersion);
system.version = newVersion;
fs.writeFileSync('system.json', JSON.stringify(system, null, '  '));
spawn('git', ['commit', '-am', 'Update to version ' + newVersion]);
spawn('git', ['tag', newVersion]);
