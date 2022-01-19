import {IItemTemplateData} from '../shared';
import {ItemSlotResponse} from './item-slot.response';
import {Guid} from '../shared/util';

export interface ItemTemplateResponse {
    id: Guid;
    subCategoryId: number;
    name: string;
    techName?: string;
    source: string;
    sourceUserId?: number;
    sourceUser?: string;
    data: IItemTemplateData;

    modifiers: ItemTemplateModifierResponse[];
    skillIds: Guid[];
    unSkillIds: Guid[];
    skillModifiers: ItemTemplateSkillModifierResponse[];
    requirements: ItemTemplateRequirementResponse[];
    slots: ItemSlotResponse[];
}

export interface ItemTemplateModifierResponse {
    stat: string;
    value: number;
    type: string;
    special?: string[];
    jobId?: Guid;
    originId?: Guid;
}

export interface ItemTemplateSkillModifierResponse {
    skillId: Guid;
    value: number;
}

export interface ItemTemplateRequirementResponse {
    stat: string;
    min: number;
    max: number;
}
