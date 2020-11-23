const fs = require('fs');

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
let newVersion = incrementVersion(system.version, process.argv.slice(2)[0]);
system.download = system.download.replace(system.version, newVersion);
system.version = newVersion;
fs.writeFileSync('system.json', JSON.stringify(system, null, '  '));
