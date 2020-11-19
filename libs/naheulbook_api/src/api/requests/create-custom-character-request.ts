import {CharacterSex} from '../shared/enums';
import {Guid} from '../shared/util';

export interface CreateCustomCharacterRequest {
    name: string;
    sex: CharacterSex;
    fatePoint: number;
    level: number;
    experience: number;
    stats: {
        ad: number,
        cou: number,
        cha: number,
        fo: number,
        int: number
    };
    basicStatsOverrides: {
        at: number,
        prd: number,
        ev: number,
        ea: number
    },
    originId: Guid;
    jobIds: Guid[];
    skillIds: number[];
    specialityIds: { [jobId: string]: Guid[] };

    isNpc?: boolean;
    groupId?: number;
}
