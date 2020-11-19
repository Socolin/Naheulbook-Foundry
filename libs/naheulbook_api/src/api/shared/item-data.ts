import {DurationType} from './enums';

export interface IItemData {
    name: string;
    description?: string;
    quantity?: number;
    icon?: {
        name: string;
        color: string;
        rotation: number;
    };
    charge?: number;
    ug?: number;
    equiped?: number;
    readCount?: number;
    notIdentified?: boolean;
    ignoreRestrictions?: boolean;
    lifetime?: {
        durationType: DurationType;
        combatCount?: number;
        lapCount?: number;
        duration?: string;
        timeDuration?: number;
    };
    shownToGm?: boolean;
}
