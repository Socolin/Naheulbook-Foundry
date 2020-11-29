import {NaheulbookApi} from "./naheulbook-api.js";
import {MonsterConnector} from "./monster-connector.js";
import {NaheulbookLogger} from "./naheulbook-logger.js";
import {CharacterConnector} from "./character-connector.js";

export class NaheulbookConnector {
    updatableStats = ['ev', 'ea'];
    isSynchronizing = false;

    /**
     * @type NaheulbookLogger
     * @private
     */
    _logger;

    /**
     * @type {MonsterConnector|undefined}
     * @private
     */
    _monsterConnector;

    /**
     * @type {CharacterConnector|undefined}
     * @private
     */
    _characterConnector;

    /**
     * @type NaheulbookConfig
     * @private
     */
    _config;

    /**
     * @type {NaheulbookApi|undefined}
     * @private
     */
    _nhbkApi;

    /**
     * @param {NaheulbookConfig} config
     */
    constructor(config) {
        this._config = config;
        this._logger = new NaheulbookLogger();
    }

    init() {
        Hooks.on('naheulbookConfig', async (config) => {
            this._config = config;
            await this.disconnect();
            await this.connect();
        })

        Hooks.on('renderPlayerList', (playerList, div, userData) => {
            if (game.user.role === USER_ROLES.GAMEMASTER) {
                return;
            }
            const gameMasterOnline = userData.users.find(u => u.role === USER_ROLES.GAMEMASTER && u.active)
            if (this.isSynchronizing && gameMasterOnline) {
                // Game master just connect, disconnect to avoid duplicate notification
                this.disconnect();
            } else if (!this.isSynchronizing && !gameMasterOnline) {
                // Game master disconnected, let's connect
                this.connect(this.naheulbookHost, this.groupId, this.accessKey);
            }
        });
    }

    async disconnect() {
        this._monsterConnector?.disable();
        this._monsterConnector = undefined;
        this._characterConnector?.disable();
        this._characterConnector = undefined;
        this._nhbkApi?.disconnect();
        this._nhbkApi = undefined;
    }

    async connect() {
        this._logger.info('Connecting to naheulbook...', this._config);
        if (this._nhbkApi) {
            return;
        }

        if (game.user.role !== USER_ROLES.GAMEMASTER) {
            if (game.users.entities.find(u => u.role === USER_ROLES.GAMEMASTER && u.active)) {
                this._logger.info('A GM is already connected, skip naheulbook sync');
                return;
            }
        }

        this._nhbkApi = NaheulbookApi.create(this._config.naheulbookHost, this._config.accessKey);
        await this._nhbkApi.init();

        this._logger.info('Connected to Naheulbook');

        this._monsterConnector = new MonsterConnector(this._nhbkApi, this._logger);
        this._monsterConnector.enable();

        await this._monsterConnector.synchronizeGroupMonsters(this._config.groupId);
        await this._monsterConnector.synchronizeExistingMonstersActors();

        this._characterConnector = new CharacterConnector(this._nhbkApi, this._logger);
        this._characterConnector.enable();

        await this._characterConnector.synchronizeGroupCharacters(this._config.groupId);
        await this._characterConnector.synchronizeExistingCharactersActors();

        this._logger.info('Sync to Naheulbook completed');
    }
}
