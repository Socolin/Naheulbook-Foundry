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
}
