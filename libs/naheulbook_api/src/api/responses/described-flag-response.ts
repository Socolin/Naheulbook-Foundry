import {FlagResponse} from './flag-response';

export interface DescribedFlagResponse {
    description: string;
    flags: FlagResponse[];
}
