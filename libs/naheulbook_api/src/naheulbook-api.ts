import {Character} from './models/character.model';
import {NaheulbookWebsocket} from './naheulbook-websocket';
import {NaheulbookHttpApi} from './naheulbook-http-api';
import {NaheulbookDataApi} from './naheulbook-data-api';
import {CharacterResponse, MonsterResponse} from './api/responses';
import {Monster} from './models/monster.model';

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

    async synchronizeMonster(monsterId: number, onChange: (monster: Monster) => void): Promise<Monster> {
        let monster = await this.loadMonsterData(monsterId);
        await this.naheulbookWebsocket.synchronizeMonster(monster);
        monster.onUpdate.subscribe(onChange);
        monster.update();
        return monster;
    }

    changeCharacterStat(characterId: number, stat: string, value: any): Promise<any> {
        return this.naheulbookHttpApi.patch(`/api/v2/characters/${characterId}/`, {
            [stat]: value
        });
    }

    updateMonsterData(monsterId: number, data: any): Promise<any> {
        return this.naheulbookHttpApi.put(`/api/v2/monsters/${monsterId}/data`, data);
    }

    private async loadMonsterData(monsterId: number): Promise<Monster> {
        let monsterResponse = await this.naheulbookHttpApi.get<MonsterResponse>(`/api/v2/monsters/${monsterId}`);
        let skillsById = await this.naheulbookDataApi.getSkillsById();
        return Monster.fromResponse(monsterResponse, skillsById);
    }

    private async loadCharacterData(characterId: number): Promise<Character> {
        let origins = await this.naheulbookDataApi.getOrigins();
        let jobs = await this.naheulbookDataApi.getJobs();
        let skillsById = await this.naheulbookDataApi.getSkillsById();
        let characterResponse = await this.naheulbookHttpApi.get<CharacterResponse>(`/api/v2/characters/${characterId}`);
        return Character.fromResponse(characterResponse, origins, jobs, skillsById);
    }

    public static create(naheulbookHost: string): NaheulbookApi {
        const naheulbookHttpApi = new NaheulbookHttpApi(naheulbookHost);
        const naheulbookDataApi = new NaheulbookDataApi(naheulbookHttpApi);
        const naheulbookWebsocket = new NaheulbookWebsocket(naheulbookHost, naheulbookDataApi);
        return new NaheulbookApi(naheulbookWebsocket, naheulbookHttpApi, naheulbookDataApi);
    }
}
