import {BaseStatsActorProperties} from './base-stats-actor-properties';

export interface MonsterActorProperties {
    type: 'monster';
    data: MonsterActorData;
}

export interface MonsterActorData extends BaseStatsActorProperties {
    naheulbookMonsterId: number;
    cou: { value: number },
    chercheNoise: { value: boolean }
    dmg: { name: string, damage: string, incompatible?: boolean }[];
}
