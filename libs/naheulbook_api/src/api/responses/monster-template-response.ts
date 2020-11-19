import {ItemTemplateResponse} from './item-template-response';
import {MonsterTemplateData} from '../shared';

export interface MonsterTemplateResponse {
    id: number;
    name: string;
    subCategoryId: number;
    data: MonsterTemplateData;
    inventory: MonsterTemplateInventoryElementResponse[];
}

export interface MonsterTemplateInventoryElementResponse {
    id: number;
    itemTemplate: ItemTemplateResponse;
    minCount: number;
    maxCount: number;
    chance: number;
    hidden: boolean;
}
