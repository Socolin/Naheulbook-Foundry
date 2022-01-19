import {Guid} from '../shared/util';

export interface CharacterLevelUpRequest {
    evOrEa: string;
    evOrEaValue: number;
    targetLevelUp: number;
    statToUp: string;
    skillId?: Guid;
    specialityIds: Guid[];
}
