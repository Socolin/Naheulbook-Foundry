import {StatModificationOperand} from './enums';

export interface IStatModifier {
    stat: string;
    type: StatModificationOperand;
    value: number;
    special?: string[];
}
