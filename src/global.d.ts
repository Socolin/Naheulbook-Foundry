import type {CharacterDataModel, MonsterDataModel} from './models/actor/actor-data-models';
import type {NaheulbookActor} from './models/actor/naheulbook-actor';
import type {NaheulbookConfig} from './naheulbook-config';

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    interface AssumeHookRan {
        ready: never; // the type doesn't matter
    }

    interface DocumentClassConfig {
        Actor: typeof NaheulbookActor;
    }

    interface DataModelConfig {
        Actor: {
            character: typeof CharacterDataModel;
            monster: typeof MonsterDataModel;
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
