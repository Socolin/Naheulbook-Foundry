import {BaseStatsActorProperties} from './base-stats-actor-properties';
import {CharacterWeaponDamage} from '../../naheulbook-api/models/character.model';
import {NaheulbookActor} from './naheulbook-actor';
import {NaheulbookActorCharacter} from './naheulbook-actor-types';

export type CharacterActorData = BaseStatsActorProperties & {
    naheulbookCharacterId?: number;
    cou: number;
    int: number;
    cha: number;
    ad: number;
    fo: number;
    spellDamageBonus: number;
    weapons: CharacterWeaponDamage[];
}

export function assertIsCharacter(actor?: NaheulbookActor | null): asserts actor is NaheulbookActorCharacter {
    if (!actor) {
        throw new Error('Actor is not defined');
    }
    if (actor.type !== 'character') {
        throw new Error('Not supported for actor of type: ' + actor.type);
    }
}
