import {ItemResponse} from './item-response';
import {MonsterResponse} from './monster-response';

export interface LootResponse {
    id: number;
    name: string;
    visibleForPlayer: boolean;
    items: ItemResponse[];
    monsters: MonsterResponse[];
}
