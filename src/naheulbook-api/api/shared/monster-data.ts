import {MonsterAttackData} from './monster-attack-data';

export interface IMonsterData {
    attacks: MonsterAttackData[];
    prd?: number;
    esq?: number;
    ev: number;
    maxEv: number;
    ea: number;
    maxEa: number;
    pr: number;
    pr_magic: number;
    cou: number;
    chercheNoise: boolean;
    resm: number;
    xp: number;
    note: string;
    color: string;
    number: number;
    sex?: string;
    page?: number;
}
