import {IStatModifier} from '../shared';
import {DurationType} from '../shared/enums';

export interface CreateEffectRequest {
    name: string;
    description?: string;
    dice?: number;
    durationType: DurationType;
    duration?: string;
    combatCount?: number;
    lapCount?: number;
    timeDuration?: number;
    modifiers: IStatModifier[];
}
