import {Character} from './models/character.model';
import {NaheulbookWebsocket} from './naheulbook-websocket';
import {NaheulbookHttpApi} from './naheulbook-http-api';
import {NaheulbookDataApi} from './naheulbook-data-api';
import {CharacterResponse} from './api/responses';

export interface WsMessage {
    opcode: string;
    type: string;
    id: number;
    data: any;
}

export class WsEvent {
    id: number;
    opcode: string;
    data: any;
}

export class NaheulbookApi {
    constructor(
        private readonly naheulbookWebsocket: NaheulbookWebsocket,
        private readonly naheulbookHttpApi: NaheulbookHttpApi,
        private readonly naheulbookDataApi: NaheulbookDataApi
    ) {
    }

    async init() {
        await this.naheulbookWebsocket.connectToNaheulbookWebsocket();
    }

    async synchronizeCharacter(characterId: number, onChange: (character: Character) => void): Promise<Character> {
        let character = await this.loadCharacterData(characterId);
        await this.naheulbookWebsocket.synchronizeCharacter(character);
        character.onUpdate.subscribe(onChange);
        character.update();
        return character;
    }

    changeCharacterStat(characterId: number, stat: string, value: any): Promise<any> {
        return this.naheulbookHttpApi.patch(`/api/v2/characters/${characterId}/`, {
            [stat]: value
        });
    }

    private async loadCharacterData(characterId: number): Promise<Character> {
        let origins = await this.naheulbookDataApi.getOrigins();
        let jobs = await this.naheulbookDataApi.getJobs();
        let skillsById = await this.naheulbookDataApi.getSkillsById();
        let characterResponse = await this.naheulbookHttpApi.get<CharacterResponse>(`/api/v2/characters/${characterId}`);
        return Character.fromResponse(characterResponse, origins, jobs, skillsById);
    }

    public static create(naheulbookHost: string): NaheulbookApi {
        const naheulbookWebsocket = new NaheulbookWebsocket(naheulbookHost);
        const naheulbookHttpApi = new NaheulbookHttpApi(naheulbookHost);
        const naheulbookDataApi = new NaheulbookDataApi(naheulbookHttpApi);
        return new NaheulbookApi(naheulbookWebsocket, naheulbookHttpApi, naheulbookDataApi);
    }
}
