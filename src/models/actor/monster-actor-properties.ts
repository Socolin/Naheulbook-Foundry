import {BaseStatsActorProperties} from './base-stats-actor-properties';

export interface MonsterActorProperties {
    type: 'monster';
    data: MonsterActorData;
}

export interface MonsterDamage {
    itemId: number;
    name: string;
    damage: string;
    rollFormula: string;
    damageType?: string;
}

export interface MonsterActorData extends BaseStatsActorProperties {
    naheulbookMonsterId: number;
    cou: { value: number },
    chercheNoise: { value: boolean }
    damages: MonsterDamage[];
}
