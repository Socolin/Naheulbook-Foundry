import '';

declare global {
    namespace ClientSettings {
        interface Values {
            'naheulbook.naheulbookHost': string;
            'naheulbook.groupId': number;
            'naheulbook.accessKey': string;
        }
    }
}
