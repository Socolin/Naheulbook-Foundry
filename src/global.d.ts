import type {CharacterActorData} from './models/actor/character-actor-properties';
import type {MonsterActorData} from './models/actor/monster-actor-properties';
import type {NaheulbookActor} from './models/actor/naheulbook-actor';
import type {NaheulbookConfig} from './naheulbook-config';

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    interface AssumeHookRan {
        ready: never; // the type doesn't matter
    }

    interface DocumentClassConfig {
        Actor: typeof NaheulbookActor;
    }

    interface SourceConfig {
        Actor: {
            character: CharacterActorData;
            monster: MonsterActorData;
        };
    }

    interface FlagConfig {
        Actor: {
            naheulbook?: {
                characterId?: number;
                monsterId?: number;
            };
        };
        Folder: {
            naheulbook?: {
                specialFolder?: 'players' | 'currentFight';
            };
        };
        Macro: {
            naheulbook?: {
                sampleMacro?: string;
            };
        };
    }

    interface SettingConfig {
        'naheulbook.naheulbookHost': string;
        'naheulbook.groupId': number;
        'naheulbook.accessKey': string;
    }

    namespace Hooks {
        interface HookConfig {
            naheulbookConfig: (config: NaheulbookConfig) => void;
            naheulbookConfignaheulbookHost: (value: string) => void;
            naheulbookConfiggroupId: (value: number) => void;
            naheulbookConfigaccessKey: (value: string) => void;
            // Dice So Nice module
            diceSoNiceReady: (dice3d: unknown) => void;
            diceSoNiceRollComplete: (messageId: string) => void;
        }
    }
}

declare global {
    namespace Actor.Database {
        interface UpdateOptions {
            // Set when the update come from naheulbook, to avoid sending it back
            fromNaheulbook?: boolean;
        }
    }
}
