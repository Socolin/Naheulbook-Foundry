import {DurationType} from './enums';

export interface IDurable {
    durationType: DurationType;
    combatCount?: number;
    lapCount?: number;
    duration?: string;
    timeDuration?: number;
}
