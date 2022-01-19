import {SkillResponse} from '../api/responses';
import {Guid} from '../api/shared/util';
import {StatModifier} from './stat-modifier.model';
import {Flag, FlagData} from './flag.model';

export type SkillDictionary = { [skillId: string]: Skill };

export class Skill {
    readonly id: Guid;
    readonly name: string;
    readonly description?: string;
    readonly playerDescription?: string;
    readonly require?: string;
    readonly resist?: string;
    readonly using?: string;
    readonly roleplay?: string;
    readonly stat: string[];
    readonly test?: number;
    readonly effects: StatModifier[];
    readonly flags: Flag[];

    static  fromResponse(response: SkillResponse): Skill {
        let skill = new Skill(response);
        Object.freeze(skill);
        return skill;
    }

    private constructor(response: SkillResponse) {
        this.id = response.id;
        this.name = response.name;
        this.description = response.description;
        this.playerDescription = response.playerDescription;
        this.require = response.require;
        this.resist = response.resist;
        this.using = response.using;
        this.roleplay = response.roleplay;
        this.stat = response.stat;
        this.test = response.test;
        this.effects = response.effects || [];
        this.flags = response.flags || [];
    }

    hasFlag(flagName: string): boolean {
        if (!this.flags) {
            return false;
        }
        let i = this.flags.findIndex(f => f.type === flagName);
        return i !== -1;
    }

    getFlagsDatas(data: { [flagName: string]: FlagData[] }): void {
        if (!this.flags) {
            return;
        }
        for (let flag of this.flags) {
            if (!(flag.type in data)) {
                data[flag.type] = [];
            }
            data[flag.type].push({data: flag.data, source: {type: 'skill', name: this.name}});
        }
    }
}
