import * as signalR from '@microsoft/signalr';
import {WsMessage} from './naheulbook-api';
import {NaheulbookHttpApi} from './naheulbook-http-api';
import {Character} from './models/character.model';
import {HubConnection} from '@microsoft/signalr';

export class NaheulbookWebsocket {
    private connection?: HubConnection;
    private synchronizedCharacters: { [id: number]: Character } = {};

    async synchronizeCharacter(character: Character) {
        this.synchronizedCharacters[character.id] = character;
        if (this.connection)
            await this.sendSyncMessage('Character', character.id);
    }

    public async connectToNaheulbookWebsocket() {
        let authorizationHeader = NaheulbookHttpApi.getAuthorizationToken();
        if (!authorizationHeader) {
            return;
        }

        let connection = new signalR.HubConnectionBuilder()
            .withUrl(NaheulbookHttpApi.naheulbookHost + "/ws/listen", {
                accessTokenFactory: () => authorizationHeader,
                withCredentials: false
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build()

        connection.on("event", data => {
            let message: WsMessage = JSON.parse(data);
            if (message.type === 'character' && message.id in this.synchronizedCharacters) {
                this.synchronizedCharacters[message.id].handleWebsocketEvent(message.opcode, message.data);
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
