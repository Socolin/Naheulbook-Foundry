import {inject, singleton} from 'tsyringe';
import {InitializedGame} from './models/misc/game';

@singleton()
export class NaheulbookConfig {
    naheulbookHost: string;
    groupId: number;
    accessKey: string;

    constructor(
        @inject(InitializedGame) private readonly game: InitializedGame
    ) {
    }

    changeValue<K extends 'naheulbookHost' | 'groupId' | 'accessKey'>(valueName: K, value: this[K]) {
        this[valueName] = value;
        // Hook name is computed from the setting name, see HookConfig in global.d.ts
        (Hooks.call as (hook: string, ...args: unknown[]) => boolean)(`naheulbookConfig${valueName}`, value);
        Hooks.call('naheulbookConfig', this);
    }

    registerConfigs(): void {
        this.game.settings.register("naheulbook", "naheulbookHost", {
            name: "Naheulbook url",
            hint: "L'adresse du site à utiliser. Par exemple: https://naheulbook.fr",
            scope: "world",
            config: true,
            type: String,
            default: "https://naheulbook.fr",
            onChange: value => this.changeValue('naheulbookHost', value)
        });

        this.game.settings.register("naheulbook", "groupId", {
            name: "GroupId",
            hint: "Id du groupe sur naheulbook",
            scope: "world",
            config: true,
            type: Number,
            default: 0,
            onChange: value => this.changeValue('groupId', value)
        });

        this.game.settings.register("naheulbook", "accessKey", {
            name: "Access key",
            hint: "Clé d'accès naheulbook. Voir https://naheulbook.fr/profile",
            scope: "client",
            config: true,
            type: String,
            default: "",
            onChange: value => this.changeValue('accessKey', value)
        });

        this.naheulbookHost = this.game.settings.get("naheulbook", "naheulbookHost");
        this.groupId = this.game.settings.get("naheulbook", "groupId");
        this.accessKey = this.game.settings.get("naheulbook", "accessKey");
    }
}
