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

    public constructor(
        private readonly naheulbookHost: string,
        private readonly naheulbookDataApi: NaheulbookDataApi
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

    public async connectToNaheulbookWebsocket() {
        let authorizationHeader = NaheulbookHttpApi.getAuthorizationToken();
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
            }
        });

        await connection.start()
        this.connection = connection;
        for (let characterId of Object.keys(this.synchronizedCharacters)) {
            await this.sendSyncMessage('Character', +characterId);
        }
    }

    private async sendSyncMessage(type: string, id: number): Promise<any> {
        await this.connection.send('Subscribe' + type, id);
    }
}
