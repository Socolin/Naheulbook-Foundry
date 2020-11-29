export class NaheulbookConfig {
    /**
     * @type string
     */
    naheulbookHost;
    /**
     * @type number
     */
    groupId;
    /**
     * @type string
     */
    accessKey;

    changeValue(valueName, value) {
        this[valueName] = value;
        Hooks.call('naheulbookConfig' + valueName, value);
        Hooks.call('naheulbookConfig', this);
    }

    /**
     * @return {NaheulbookConfig}
     */
    static loadConfiguration() {
        let config = new NaheulbookConfig();

        config.naheulbookHost = game.settings.get("naheulbook", "naheulbookHost");
        config.groupId = +game.settings.get("naheulbook", "groupId");
        config.accessKey = game.settings.get("naheulbook", "accessKey");

        return config;
    }

    /**
     * @type NaheulbookConfig
     * @private
     */
    static _instance;

    /**
     * @return {NaheulbookConfig}
     */
    static get instance() {
        if (!NaheulbookConfig._instance)
            NaheulbookConfig._instance = NaheulbookConfig.loadConfiguration();
        return NaheulbookConfig._instance;
    }

    /**
     * @return void
     */
    static registerConfigs() {
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
            default: "",
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
