import {NaheulbookActor} from './naheulbook-actor';

export type NaheulbookActorCharacter = NaheulbookActor & { data: { type: 'character' } }
export type NaheulbookActorMonster = NaheulbookActor & { data: { type: 'monster' } }
