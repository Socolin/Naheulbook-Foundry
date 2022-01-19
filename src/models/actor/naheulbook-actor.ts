import {CharacterActorProperties} from './character-actor-properties';
import {MonsterActorProperties} from './monster-actor-properties';

declare global {
    interface DataConfig {
        Actor: CharacterActorProperties | MonsterActorProperties;
    }
}

declare global {
    interface DocumentClassConfig {
        Actor: typeof NaheulbookActor;
    }
}

export class NaheulbookActor extends Actor {
}
