export class NaheulbookLogger {
    info(...data) {
        if (typeof data[0] === 'string') {
            if (data.length > 1)
                console.info('%Naheulbook | ' + data[0], 'color: #0f8ddb', data.slice(1));
            else
                console.info('%cNaheulbook | ' + data[0], 'color: #0f8ddb');
        } else
            console.info(data);
    }

    warn(...data) {
        if (typeof data[0] === 'string') {
            if (data.length > 1)
                console.warn('%cNaheulbook | ' + data[0], 'color: #a1880e', data.slice(1));
            else
                console.warn('%cNaheulbook | ' + data[0], 'color: #a1880e');
        } else
            console.warn(data);
    }
}
