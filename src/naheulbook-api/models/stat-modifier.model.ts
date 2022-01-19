import {IActiveStatsModifier, IDurable} from '../api/shared';
import {DurationType, StatModificationOperand} from '../api/shared/enums';
import {Guid} from '../api/shared/util';
import {Effect} from './effect.model';

export class StatModifier {
    stat: string;
    type: StatModificationOperand = 'ADD';
    value: number;
    special?: string[];

    static apply(value: number, mod: StatModifier) {
        if (mod.type === 'ADD') {
            return value + mod.value;
        } else if (mod.type === 'SET') {
            return mod.value;
        } else if (mod.type === 'DIV') {
            return value / mod.value;
        } else if (mod.type === 'MUL') {
            return value * mod.value;
        }
        throw new Error('Invalid stat modifier')
    }

    static applyInPlace(stats: { [statName: string]: number }, mod: StatModifier) {
        stats[mod.stat] = StatModifier.apply(stats[mod.stat], mod);
    }
}

export function formatModifierValue(modifier) {
    if (modifier.type === undefined || modifier.type === 'ADD') {
        if (modifier.value <= 0) {
            return modifier.value;
        } else {
            return '+' + modifier.value;
        }
    }
    else if (modifier.type === 'DIV') {
        return '/' + modifier.value;
    }
    else if (modifier.type === 'MUL') {
        return '*' + modifier.value;
    }
    else if (modifier.type === 'SET') {
        return '=' + modifier.value;
    }
}

export class ItemStatModifier implements StatModifier {
    stat: string;
    type: StatModificationOperand;
    value: number;
    special?: string[];

    jobId?: Guid;
    originId?: Guid;
}

export class StatsModifier implements IDurable {
    name: string;

    reusable = false;

    durationType: DurationType = 'combat';
    duration?: string;
    combatCount?: number;
    lapCount?: number;
    timeDuration?: number;

    description?: string;
    type?: string;

    values: StatModifier[] = [];
}

export class LapCountDecrement {
    when: 'BEFORE' | 'AFTER';
    fighterId: number;
    fighterIsMonster: boolean;
}

export class ActiveStatsModifier extends StatsModifier {
    id: number;
    permanent: boolean;
    active: boolean;

    currentCombatCount?: number;
    currentLapCount?: number;
    currentTimeDuration?: number;

    lapCountDecrement?: LapCountDecrement;

    static fromJson(jsonData: IActiveStatsModifier) {
        let modifier = new ActiveStatsModifier();
        Object.assign(modifier, jsonData);
        return modifier;
    }

    static modifiersFromJson(modifiersJsonData: undefined | null | any[]) {
        let modifiers: ActiveStatsModifier[] = [];

        if (modifiersJsonData) {
            for (let modifierJsonData of modifiersJsonData) {
                modifiers.push(ActiveStatsModifier.fromJson(modifierJsonData));
            }
        }

        return modifiers;
    }

    static fromEffect(effect: Effect, data: any): ActiveStatsModifier {
        let modifier = new ActiveStatsModifier();
        modifier.name = effect.name;
        modifier.description = effect.description;
        modifier.permanent = false;
        modifier.reusable = data.reusable;
        modifier.type = effect.subCategory.name;
        if ('durationType' in data) {
            modifier.durationType = data.durationType;
            switch (data.durationType) {
                case 'combat':
                    modifier.combatCount = data.combatCount;
                    modifier.currentCombatCount = data.combatCount;
                    break;
                case 'time':
                    modifier.timeDuration = data.timeDuration;
                    modifier.currentTimeDuration = data.timeDuration;
                    break;
                case 'lap':
                    modifier.lapCount = data.lapCount;
                    modifier.currentLapCount = data.lapCount;
                    break;
                case 'custom':
                    modifier.duration = data.duration;
                    break;
                case 'forever':
                    break;
            }
        } else {
            modifier.durationType = effect.durationType;
            modifier.combatCount = effect.combatCount;
            modifier.currentCombatCount = effect.combatCount;
            modifier.lapCount = effect.lapCount;
            modifier.currentLapCount = effect.lapCount;
            modifier.timeDuration = effect.timeDuration;
            modifier.currentTimeDuration = effect.timeDuration;
            modifier.duration = effect.duration;
        }
        if (effect.modifiers) {
            modifier.values = JSON.parse(JSON.stringify(effect.modifiers));
        }
        return modifier;
    }
}
