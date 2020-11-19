import {IActiveStatsModifier, IMonsterData} from '../shared';
import {ItemResponse} from './item-response';

export interface MonsterResponse {
    id: number;
    name: string;
    dead?: string;
    data: IMonsterData;
    modifiers: IActiveStatsModifier[];
    items: ItemResponse[];
}
