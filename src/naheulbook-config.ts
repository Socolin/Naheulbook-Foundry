export class NaheulbookConfig {
    naheulbookHost: string;
    groupId: number;
    accessKey: string;

    changeValue(valueName, value) {
        this[valueName] = value;
        Hooks.call('naheulbookConfig' + valueName, value);
        Hooks.call('naheulbookConfig', this);
    }

    static loadConfiguration(): NaheulbookConfig {
        let config = new NaheulbookConfig();

        config.naheulbookHost = game.settings.get("naheulbook", "naheulbookHost");
        config.groupId = game.settings.get("naheulbook", "groupId");
        config.accessKey = game.settings.get("naheulbook", "accessKey");

        return config;
    }

    static _instance: NaheulbookConfig;
    static get instance(): NaheulbookConfig {
        if (!NaheulbookConfig._instance)
            NaheulbookConfig._instance = NaheulbookConfig.loadConfiguration();
        return NaheulbookConfig._instance;
    }

    static registerConfigs(): void {
        game.settings.register("naheulbook", "naheulbookHost", {
            name: "Naheulbook url",
            hint: "L'adresse du site à utiliser. Par exemple: https://naheulbook.fr",
            scope: "world",
            config: true,
            type: String,
            default: "https://naheulbook.fr",
            onChange: value => NaheulbookConfig.instance.changeValue('naheulbookHost', value)
        });

        game.settings.register("naheulbook", "groupId", {
            name: "GroupId",
            hint: "Id du groupe sur naheulbook",
            scope: "world",
            config: true,
            type: Number,
            default: 0,
            onChange: value => NaheulbookConfig.instance.changeValue('groupId', value)
        });

        game.settings.register("naheulbook", "accessKey", {
            name: "Access key",
            hint: "Clé d'accès naheulbook. Voir https://naheulbook.fr/profile",
            scope: "client",
            config: true,
            type: String,
            default: "",
            onChange: value => NaheulbookConfig.instance.changeValue('accessKey', value)
        });
    }
}
