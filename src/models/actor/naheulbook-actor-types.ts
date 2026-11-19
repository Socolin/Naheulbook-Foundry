import {NaheulbookActor} from './naheulbook-actor';
import {CharacterActorData} from './character-actor-properties';
import {MonsterActorData} from './monster-actor-properties';

export type NaheulbookActorCharacter = NaheulbookActor & { system: CharacterActorData }
export type NaheulbookActorMonster = NaheulbookActor & { system: MonsterActorData }
