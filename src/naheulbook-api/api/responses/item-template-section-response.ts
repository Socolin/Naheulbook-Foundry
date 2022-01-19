import {ItemTemplateSubCategoryResponse} from './item-template-sub-category-response';

export interface ItemTemplateSectionResponse {
    id: number;
    name: string;
    note: string;
    icon: string;
    specials: string[];
    subCategories: ItemTemplateSubCategoryResponse[];
}
