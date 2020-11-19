import {FlagResponse} from './flag-response';
import {StatModificationOperand} from '../shared/enums';
import {Guid} from '../shared/util';

export interface SkillResponse {
    id: Guid;
    name: string;
    description?: string;
    playerDescription?: string;
    require?: string;
    resist?: string;
    using?: string;
    roleplay?: string;
    stat: string[];
    test?: number;
    flags?: FlagResponse[];
    effects: {
        stat: string;
        value: number;
        type: StatModificationOperand;
    }[];
}
