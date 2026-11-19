import '';

declare global {
    namespace ClientSettings {
        interface Values {
            'naheulbook.naheulbookHost': string;
            'naheulbook.groupId': number;
            'naheulbook.accessKey': string;
        }
    }

    // Foundry v10+ fields, not described by the v9 types package
    interface User {
        hotbar: Record<string, string>;
    }
}
