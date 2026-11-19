import {BaseStatsActorProperties} from './base-stats-actor-properties';
import {NaheulbookActor} from './naheulbook-actor';
import {NaheulbookActorMonster} from './naheulbook-actor-types';

export interface MonsterDamage {
    itemId: number;
    name: string;
    at: number;
    damage?: string;
    rollFormula?: string;
    damageType?: string;
}

export type MonsterActorData = BaseStatsActorProperties & {
    naheulbookMonsterId: number;
    cou: number;
    chercheNoise: boolean;
    damages: MonsterDamage[];
}


export function assertIsMonster(actor?: NaheulbookActor | null): asserts actor is NaheulbookActorMonster {
    if (!actor) {
        throw new Error('Actor is not defined');
    }
    if (actor.type !== 'monster') {
        throw new Error('Not supported for actor of type: ' + actor.type);
    }
}
