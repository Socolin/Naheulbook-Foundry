import {singleton} from 'tsyringe';

const PREFIX = '%c[Naheulbook]';
const PREFIX_STYLE = 'color: #0f8ddb; font-weight: bold';

/**
 * Console logger that tags every message with a colored `[Naheulbook]` prefix.
 *
 * Only the prefix is styled: the message and extra arguments are passed as-is to the console,
 * so objects and errors stay inspectable and `%` characters in messages are not interpreted
 * as format specifiers.
 */
@singleton()
export class NaheulbookLogger {
    debug(...data: unknown[]): void {
        console.debug(PREFIX, PREFIX_STYLE, ...data);
    }

    info(...data: unknown[]): void {
        console.info(PREFIX, PREFIX_STYLE, ...data);
    }

    warn(...data: unknown[]): void {
        console.warn(PREFIX, PREFIX_STYLE, ...data);
    }

    error(...data: unknown[]): void {
        console.error(PREFIX, PREFIX_STYLE, ...data);
    }
}
