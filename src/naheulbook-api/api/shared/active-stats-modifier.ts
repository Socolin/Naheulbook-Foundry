import {IStatModifier} from './stat-modifier';

export interface IActiveStatsModifier {
    name: string;
    reusable: boolean;
    durationType: 'custom' | 'time' | 'combat' | 'lap' | 'forever';
    duration: string;
    combatCount: number;
    lapCount: number;
    timeDuration: number;
    description?: string;
    type?: string;
    values: IStatModifier[];

    id: number;
    permanent: boolean;
    active: boolean;
    currentCombatCount: number;
    currentLapCount: number;
    currentTimeDuration: number;

    lapCountDecrement: {
        when: 'BEFORE' | 'AFTER';
        fighterId: number;
        fighterIsMonster: boolean;
    };
};
