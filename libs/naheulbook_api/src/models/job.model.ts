
import {Speciality} from './speciality.model';
import {JobResponse} from '../api/responses';
import {JobStatData} from '../api/shared';
import {Guid} from '../api/shared/util';
import {Skill, SkillDictionary} from './skill.model';
import {DescribedFlag, Flag, FlagData} from './flag.model';
import {StatRequirement} from './stat-requirement.model';
import {Origin} from './origin.model';

export type JobDictionary = { [jobId: string]: Job };

export class Job {
    readonly availableSkills: Array<Skill>;
    readonly data: {
        forOrigin: {
            [originId: string]: JobStatData
        }
    };
    readonly bonuses: Array<DescribedFlag>;
    readonly id: Guid;
    readonly playerDescription: string;
    readonly playerSummary: string;
    readonly isMagic: boolean;
    readonly name: string;
    readonly requirements: StatRequirement[];
    readonly restrictions: DescribedFlag[];
    readonly skills: Skill[];
    readonly specialities: Speciality[];
    readonly flags: Flag[] = [];

    static fromResponse(response: JobResponse, skillsById: SkillDictionary): Job {
        const job = new Job(response, skillsById);
        Object.freeze(job);
        return job;
    }

    constructor(response: JobResponse, skillsById: SkillDictionary) {
        this.data = {...response.data};
        this.bonuses = DescribedFlag.fromResponses(response.bonuses);
        this.id = response.id;
        this.playerDescription = response.playerDescription;
        this.playerSummary = response.playerSummary;
        this.isMagic = response.isMagic || false;
        this.name = response.name;
        this.requirements = response.requirements;
        this.restrictions = DescribedFlag.fromResponses(response.restrictions);
        this.skills = response.skillIds.map(skillId => skillsById[skillId]);
        this.availableSkills = response.availableSkillIds.map(skillId => skillsById[skillId]);
        this.specialities = Speciality.fromResponses(response.specialities);
        this.flags = response.flags || [];
    }

    getStatData(origin: Origin): JobStatData {
        if (origin.id in this.data.forOrigin) {
            return this.data.forOrigin[origin.id];
        }

        return this.data.forOrigin['all'];
    }

    hasFlag(flagName: string): boolean {
        for (let restrict of this.restrictions) {
            if (restrict.hasFlag(flagName)) {
                return true;
            }
        }

        for (let bonus of this.bonuses) {
            if (bonus.hasFlag(flagName)) {
                return true;
            }
        }

        return this.flags.findIndex(f => f.type === flagName) !== -1;
    }

    getFlagsDatas(data: { [flagName: string]: FlagData[] }): void {
        for (let restrict of this.restrictions) {
            restrict.getFlagDatas(data, {type: 'job', name: this.name});
        }

        for (let bonus of this.bonuses) {
            bonus.getFlagDatas(data, {type: 'job', name: this.name});
        }

        for (let flag of this.flags) {
            if (!(flag.type in data)) {
                data[flag.type] = [];
            }
            data[flag.type].push({data: flag.data, source: {type: 'job', name: this.name}});
        }
    }
}
