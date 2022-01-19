import {EffectSubCategoryResponse} from './effect-sub-category-response';

export interface EffectTypeResponse {
    id: number;
    name: string;
    subCategories: EffectSubCategoryResponse[];
}
