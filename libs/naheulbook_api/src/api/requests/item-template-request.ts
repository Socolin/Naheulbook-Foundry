import {IItemTemplateData} from '../shared';
import {Guid} from '../shared/util';

export interface ItemTemplateRequest {
    source: 'official' | 'community' | 'private';
    subCategoryId: number;
    name: string;
    techName?: string;
    modifiers: ItemTemplateModifierRequest[];
    skillIds: Guid[];
    unSkillIds: Guid[];
    skillModifiers: ItemTemplateSkillModifierRequest[];
    requirements: ItemTemplateRequirementRequest[];
    slots: { id: number }[];
    data: IItemTemplateData;
}

export interface ItemTemplateModifierRequest {
    stat: string;
    value: number;
    type: string;
    special?: string[];
    jobId?: Guid;
    originId?: Guid;
}

export interface ItemTemplateSkillModifierRequest {
    skillId: Guid;
    value: number;
}

export interface ItemTemplateRequirementRequest {
    stat: string;
    min?: number;
    max?: number;
}
