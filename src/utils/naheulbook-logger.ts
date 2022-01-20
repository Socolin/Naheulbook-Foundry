export class NaheulbookLogger {
    info(...data) {
        if (typeof data[0] === 'string') {
            if (data.length > 1)
                console.info('%c' + data[0], 'color: #0f8ddb', data.slice(1));
            else
                console.info('%c' + data[0], 'color: #0f8ddb');
        } else
            console.info(data);
    }
}
