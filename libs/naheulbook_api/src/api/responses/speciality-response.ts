import {FlagResponse} from './flag-response';
import {IStatModifier} from '../shared';
import {Guid} from '../shared/util';

export interface SpecialityResponse {
    id: Guid;
    name: string;
    description: string;
    modifiers: IStatModifier[];
    specials: {
        id: number;
        isBonus: boolean;
        description: string;
        flags?: FlagResponse[];
    }[];
    flags?: FlagResponse[];
}

