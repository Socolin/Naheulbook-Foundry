import {MonsterTemplateData} from '../shared';
import {Guid} from '../shared/util';

export interface MonsterInventoryElementRequest {
    itemTemplateId: Guid;
    minCount: number;
    maxCount: number;
    chance: number;
    hidden: boolean;
    minUg?: number;
    maxUg?: number;
}

export interface EditMonsterInventoryElementRequest extends MonsterInventoryElementRequest {
    id: number;
}

export interface MonsterTemplateRequest {
    subCategoryId: number;
    name: string;
    data: MonsterTemplateData;
    inventory: MonsterInventoryElementRequest[];
}

