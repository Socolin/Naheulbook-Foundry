import {Character} from './models/character.model';
import {NaheulbookWebsocket} from './naheulbook-websocket';
import {NaheulbookHttpApi} from './naheulbook-http-api';
import {NaheulbookDataApi} from './naheulbook-data-api';
import {CharacterResponse, GroupResponse, MonsterResponse} from './api/responses';
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
    async disconnect() {
        await this.naheulbookWebsocket.disconnect();
    }

    async synchronizeCharacter(character: Character, onChange: (character: Character) => void): Promise<Character> {
        await this.naheulbookWebsocket.synchronizeCharacter(character);
        character.onUpdate.subscribe(onChange);
        character.update();
        return character;
    }

    async stopSynchronizeCharacter(characterId: number): Promise<void> {
        await this.naheulbookWebsocket.stopSynchronizeCharacter(characterId)
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

    async loadGroupMonsters(groupId): Promise<Monster[]> {
        let skillsById = await this.naheulbookDataApi.getSkillsById();
        let monstersResponses = await this.naheulbookHttpApi.get<MonsterResponse[]>(`/api/v2/groups/${groupId}/monsters`)
        return monstersResponses.map(monsterResponse => Monster.fromResponse(monsterResponse, skillsById));
    }

    loadGroupData(groupId): Promise<GroupResponse> {
        return this.naheulbookHttpApi.get<GroupResponse>(`/api/v2/groups/${groupId}`)
    }

    async listenToGroupEvent(groupId: number, onEvent: {
        addMonster: (monster: Monster) => void,
        killMonster: (monsterId: number) => void,
    }): Promise<any> {
        let skillsById = await this.naheulbookDataApi.getSkillsById();
        return this.naheulbookWebsocket.listenForGroupEvents(groupId, ((opcode, data) => {
            switch (opcode) {
                case 'addMonster': {
                    let monster = Monster.fromResponse(data, skillsById);
                    monster.update();
                    onEvent.addMonster(monster);
                    break;
                }
                case 'killMonster':
                    onEvent.killMonster(data);
                    break;
            }
        }));
    }

    public async loadMonsterData(monsterId: number): Promise<Monster> {
        let monsterResponse = await this.naheulbookHttpApi.get<MonsterResponse>(`/api/v2/monsters/${monsterId}`);
        let skillsById = await this.naheulbookDataApi.getSkillsById();
        return Monster.fromResponse(monsterResponse, skillsById);
    }

    public async loadCharacterData(characterId: number): Promise<Character> {
        let origins = await this.naheulbookDataApi.getOrigins();
        let jobs = await this.naheulbookDataApi.getJobs();
        let skillsById = await this.naheulbookDataApi.getSkillsById();
        let characterResponse = await this.naheulbookHttpApi.get<CharacterResponse>(`/api/v2/characters/${characterId}`);
        return Character.fromResponse(characterResponse, origins, jobs, skillsById);
    }

    public static create(naheulbookHost: string, accessKey: string): NaheulbookApi {
        const naheulbookHttpApi = new NaheulbookHttpApi(naheulbookHost, accessKey);
        const naheulbookDataApi = new NaheulbookDataApi(naheulbookHttpApi);
        const naheulbookWebsocket = new NaheulbookWebsocket(naheulbookHost, naheulbookDataApi, accessKey);
        return new NaheulbookApi(naheulbookWebsocket, naheulbookHttpApi, naheulbookDataApi);
    }
}
