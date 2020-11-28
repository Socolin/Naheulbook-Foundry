import * as signalR from '@microsoft/signalr';
import {WsMessage} from './naheulbook-api';
import {NaheulbookHttpApi} from './naheulbook-http-api';
import {Character} from './models/character.model';
import {HubConnection} from '@microsoft/signalr';
import {Monster} from './models/monster.model';
import {NaheulbookDataApi} from './naheulbook-data-api';

export class NaheulbookWebsocket {
    private connection?: HubConnection;
    private synchronizedCharacters: { [id: number]: Character } = {};
    private synchronizedMonsters: { [id: number]: Monster } = {};
    private synchronizedGroup: { [id: number]: (opcode: string, data: any) => void } = {};

    public constructor(
        private readonly naheulbookHost: string,
        private readonly naheulbookDataApi: NaheulbookDataApi,
        private readonly accessKey: string,
    ) {
    }

    async synchronizeCharacter(character: Character) {
        this.synchronizedCharacters[character.id] = character;
        if (this.connection)
            await this.sendSyncMessage('Character', character.id);
    }

    async synchronizeMonster(monster: Monster) {
        this.synchronizedMonsters[monster.id] = monster;
        if (this.connection)
            await this.sendSyncMessage('Monster', monster.id);
    }

    async listenForGroupEvents(groupId: number, onEvent: (opcode: string, data: any) => void) {
        this.synchronizedGroup[groupId] = onEvent;
        if (this.connection)
            await this.sendSyncMessage('Group', groupId);
    }

    public async disconnect() {
        if (this.connection) {
            await this.connection.stop()
            this.connection = undefined;
            this.synchronizedCharacters = {};
            this.synchronizedMonsters = {};
            this.synchronizedGroup = {};
        }
    }

    public async connectToNaheulbookWebsocket() {
        let authorizationHeader = this.getAuthorizationToken();
        if (!authorizationHeader) {
            return;
        }

        let skillsById = await this.naheulbookDataApi.getSkillsById();
        let jobsById = await this.naheulbookDataApi.getJobsById();

        let connection = new signalR.HubConnectionBuilder()
            .withUrl(this.naheulbookHost + "/ws/listen", {
                accessTokenFactory: () => authorizationHeader,
                withCredentials: false
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build()

        connection.on("event", data => {
            let message: WsMessage = JSON.parse(data);
            if (message.type === 'character' && message.id in this.synchronizedCharacters) {
                this.synchronizedCharacters[message.id].handleWebsocketEvent(message.opcode, message.data, {
                    skillsById,
                    jobsById
                });
            } else if (message.type === 'monster' && message.id in this.synchronizedMonsters) {
                this.synchronizedMonsters[message.id].handleWebsocketEvent(message.opcode, message.data, {
                    skillsById,
                    jobsById
                });
            } else if (message.type === 'group' && message.id in this.synchronizedGroup) {
                this.synchronizedGroup[message.id](message.opcode, message.data);
            }
        });

        await connection.start()
        this.connection = connection;
        for (let characterId of Object.keys(this.synchronizedCharacters)) {
            await this.sendSyncMessage('Character', +characterId);
        }
        for (let groupId of Object.keys(this.synchronizedGroup)) {
            await this.sendSyncMessage('Group', +groupId);
        }
        for (let monsterId of Object.keys(this.synchronizedMonsters)) {
            await this.sendSyncMessage('Monster', +monsterId);
        }
    }

    private async sendSyncMessage(type: string, id: number): Promise<any> {
        await this.connection.send('Subscribe' + type, id);
    }

    public getAuthorizationToken(): string | undefined {
        if (!this.accessKey)
            return;
        return `userAccessToken:${this.accessKey}`;
    }
}
