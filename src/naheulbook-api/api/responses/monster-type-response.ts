import {MonsterSubCategoryResponse} from './monster-sub-category-response';

export interface MonsterTypeResponse {
    id: number;
    name: string;
    subCategories: MonsterSubCategoryResponse[];
}
