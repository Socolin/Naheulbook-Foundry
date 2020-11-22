import {OriginResponse} from '../api/responses';
import {OriginData} from '../api/shared/origin-data';
import {Guid} from '../api/shared/util';
import {Skill, SkillDictionary} from './skill.model';
import {DescribedFlag, Flag, FlagData} from './flag.model';
import {StatRequirement} from './stat-requirement.model';

export interface OriginInfo {
    title: string;
    description: string;
}

export type OriginDictionary = { [originId: string]: Origin };

export class Origin {
    readonly id: Guid;
    readonly name: string;
    readonly data: OriginData;
    readonly description: string;
    readonly playerDescription?: string;
    readonly playerSummary?: string;
    readonly advantage?: string;
    readonly size?: string;
    readonly requirements: StatRequirement[];
    readonly information: OriginInfo[];
    readonly skills: Skill[];
    readonly availableSkills: Skill[];
    readonly bonuses: DescribedFlag[];
    readonly restrictions: DescribedFlag[];
    readonly flags: Flag[] = [];

    static fromResponse(response: OriginResponse, skillsById: SkillDictionary): Origin {
        const origin = new Origin(response, skillsById);
        Object.freeze(origin);
        return origin;
    }

    private constructor(response: OriginResponse, skillsById: SkillDictionary) {
        this.id = response.id;
        this.name = response.name;
        this.description = response.description;
        this.playerDescription = response.playerDescription;
        this.playerSummary = response.playerSummary;
        this.advantage = response.advantage;
        this.data = {...response.data};
        this.size = response.size;
        this.requirements = response.requirements;
        this.information = response.information;
        this.skills = response.skillIds.map(skillId => skillsById[skillId]);
        this.availableSkills = response.availableSkillIds.map(skillId => skillsById[skillId]);
        this.bonuses = DescribedFlag.fromResponses(response.bonuses);
        this.restrictions = DescribedFlag.fromResponses(response.restrictions);
        this.flags = response.flags || [];
    }

    hasFlag(flagName: string): boolean {
        let i = this.flags.findIndex(f => f.type === flagName);
        if (i !== -1) {
            return true;
        }

        for (let restriction of this.restrictions) {
            if (restriction.hasFlag(flagName)) {
                return true;
            }
        }

        for (let bonus of this.bonuses) {
            if (bonus.hasFlag(flagName)) {
                return true;
            }
        }

        return false;
    }

    getFlagsDatas(data: {[flagName: string]: FlagData[]}): void {
        for (let restriction of this.restrictions) {
            restriction.getFlagDatas(data, {type: 'origin', name: this.name});
        }

        for (let bonus of this.bonuses) {
            bonus.getFlagDatas(data, {type: 'origin', name: this.name});
        }

        for (let flag of this.flags) {
            if (!(flag.type in data)) {
                data[flag.type] = [];
            }
            data[flag.type].push({data: flag.data, source: {type: 'origin', name: this.name}});
        }
    }
}
