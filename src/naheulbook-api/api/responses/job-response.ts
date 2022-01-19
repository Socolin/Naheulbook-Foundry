import {FlagResponse} from './flag-response';
import {DescribedFlagResponse} from './described-flag-response';
import {SpecialityResponse} from './speciality-response';
import {JobStatData} from '../shared';
import {Guid} from '../shared/util';
import {StatRequirementResponse} from './stat-requirement-response';

export interface JobResponse {
    id: Guid;
    name: string;
    information?: string;
    playerDescription: string;
    playerSummary: string;
    isMagic?: boolean;
    data: {
        forOrigin: {
            [originId: string]: JobStatData
        }
    };
    flags?: FlagResponse[];
    skillIds: number[];
    availableSkillIds: number[];
    bonuses: DescribedFlagResponse[];
    requirements: StatRequirementResponse[];
    restrictions: DescribedFlagResponse[];
    specialities: SpecialityResponse[];
}
