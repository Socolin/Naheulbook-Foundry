import {MonsterConnector} from "./monster-connector.js";
import {NaheulbookLogger} from "../utils/naheulbook-logger.js";
import {CharacterConnector} from "./character-connector.js";
import {NaheulbookApi} from '../naheulbook-api/naheulbook-api';
import {NaheulbookConfig} from '../naheulbook-config';
import {inject, singleton} from 'tsyringe';

@singleton()
export class NaheulbookConnector {
    private monsterConnector?: MonsterConnector;
    private characterConnector?: CharacterConnector;
    private nhbkApi?: NaheulbookApi;

    constructor(
        @inject(NaheulbookConfig) private readonly config: NaheulbookConfig,
        @inject(NaheulbookLogger) private readonly logger: NaheulbookLogger,
        @inject(Game) private readonly game: Game,
    ) {
    }

    init() {
        Hooks.on('naheulbookConfig', async (_config) => {
            if (this.nhbkApi) {
                await this.disconnect();
                await this.connect();
            }
        })

        Hooks.on('renderPlayerList', (playerList, div, userData) => {
            if (this.game.user!.role === CONST.USER_ROLES.GAMEMASTER) {
                return;
            }
            const gameMasterOnline = userData.users.find(u => u.role === CONST.USER_ROLES.GAMEMASTER && u.active)
            if (this.nhbkApi && gameMasterOnline) {
                // Game master just connect, disconnect to avoid duplicate notification
                this.disconnect();
            } else if (!this.nhbkApi && !gameMasterOnline) {
                // Game master disconnected, let's connect
                this.connect();
            }
        });
    }

    async disconnect() {
        this.monsterConnector?.disable();
        this.monsterConnector = undefined;
        this.characterConnector?.disable();
        this.characterConnector = undefined;
        this.nhbkApi?.disconnect();
        this.nhbkApi = undefined;
    }

    async connect() {
        this.logger.info('Connecting to naheulbook...', this.config);
        if (this.nhbkApi) {
            return;
        }

        if (this.game.user!.role !== CONST.USER_ROLES.GAMEMASTER) {
            if (this.game.users!.contents.find(u => u.role === CONST.USER_ROLES.GAMEMASTER && u.active)) {
                this.logger.info('A GM is already connected, skip naheulbook sync');
                return;
            }
        }

        this.nhbkApi = NaheulbookApi.create(this.config.naheulbookHost, this.config.accessKey);
        await this.nhbkApi.init();

        this.logger.info('Connected to Naheulbook');

        this.monsterConnector = new MonsterConnector(this.nhbkApi, this.logger);
        this.monsterConnector.enable();

        await this.monsterConnector.synchronizeGroupMonsters(this.config.groupId);
        await this.monsterConnector.synchronizeExistingMonstersActors();

        this.characterConnector = new CharacterConnector(this.nhbkApi, this.logger);
        this.characterConnector.enable();

        await this.characterConnector.synchronizeGroupCharacters(this.config.groupId);
        await this.characterConnector.synchronizeExistingCharactersActors();

        this.logger.info('Sync to Naheulbook completed');
    }
}
