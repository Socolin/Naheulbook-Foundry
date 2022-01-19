import {SpecialityResponse} from '../api/responses';
import {Guid} from '../api/shared/util';
import {Flag, FlagData} from './flag.model';
import {StatModifier} from './stat-modifier.model';

export class Speciality {
    readonly id: Guid;
    readonly name: string;
    readonly description: string;
    readonly specials: {
        readonly id: number,
        readonly isBonus: boolean;
        readonly description: string;
        readonly flags: Flag[];
    }[];
    readonly modifiers: StatModifier[];
    readonly flags: Flag[];

    static fromResponse(response: SpecialityResponse): Speciality {
        const speciality = new Speciality(response);
        Object.freeze(speciality);
        return speciality;
    }

    static fromResponses(responses: SpecialityResponse[]) {
        return responses.map(response => Speciality.fromResponse(response));
    }

    private constructor(response: SpecialityResponse) {
        this.id = response.id;
        this.name = response.name;
        this.description = response.description;
        this.modifiers = response.modifiers;
        this.specials = (response.specials || []).map(s => ({
            ...s,
            flags: s.flags || []
        }));
        this.flags = response.flags || [];
    }

    hasFlag(flagName: string): boolean {
        let i = this.flags.findIndex(f => f.type === flagName);
        if (i !== -1) {
            return true;
        }

        for (let special of this.specials) {
            let j = special.flags.findIndex(f => f.type === flagName);
            if (j !== -1) {
                return true;
            }
        }

        return false;
    }

    getFlagsDatas(data: {[flagName: string]: FlagData[]}): void {
        for (let flag of this.flags) {
            if (!(flag.type in data)) {
                data[flag.type] = [];
            }
            data[flag.type].push({data: flag.data, source: {type: 'speciality', name: this.name}});
        }

        for (let special of this.specials) {
            for (let flag of special.flags) {
                if (!(flag.type in data)) {
                    data[flag.type] = [];
                }
                data[flag.type].push({data: flag.data, source: {type: 'speciality', name: this.name}});
            }
        }
    }
}
