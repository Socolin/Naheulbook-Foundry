import {BaseStatsActorProperties} from './base-stats-actor-properties';

export interface CharacterActorProperties {
    type: 'character';
    data: CharacterActorData;
}

export interface CharacterActorData extends BaseStatsActorProperties {
    naheulbookCharacterId: number;
    cou: { value: number }
    int: { value: number }
    cha: { value: number }
    ad: { value: number }
    fo: { value: number }
    weaponDamages: { [weaponName: string]: string };
}
