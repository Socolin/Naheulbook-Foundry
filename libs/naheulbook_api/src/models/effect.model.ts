import {IDurable} from '../api/shared';
import {DurationType} from '../api/shared/enums';
import {EffectSubCategoryResponse, EffectResponse, EffectTypeResponse} from '../api/responses';
import {StatModifier} from './stat-modifier.model';

export type EffectSubCategoryDictionary = { [id: number]: EffectSubCategory };

export class EffectSubCategory {
    id: number;
    name: string;
    type: EffectType;
    diceSize: number;
    diceCount: number;
    note: string;

    static fromResponse(response: EffectSubCategoryResponse, type: EffectTypeDictionary | EffectType): EffectSubCategory {
        let subCategory = new EffectSubCategory();
        if (type instanceof EffectType) {
            Object.assign(subCategory, response, {type: type});
        } else {
            Object.assign(subCategory, response, {type: type[response.typeId]});
        }
        return subCategory;
    }

    static fromResponses(responses: EffectSubCategoryResponse[], type: EffectType): EffectSubCategory[] {
        return responses.map(response => EffectSubCategory.fromResponse(response, type));
    }
}

export type EffectTypeDictionary = { [id: number]: EffectType };

export class EffectType {
    id: number;
    name: string;
    subCategories: EffectSubCategory[] = [];

    static fromResponse(response: EffectTypeResponse): EffectType {
        let type = new EffectType();
        Object.assign(type, response, {subCategories: EffectSubCategory.fromResponses(response.subCategories, type)});
        return type;
    }

    static fromResponses(responses: EffectTypeResponse[]): EffectType[] {
        return responses.map(response => EffectType.fromResponse(response));
    }
}

export class Effect implements IDurable {
    id: number;
    name: string;
    subCategory: EffectSubCategory;
    description: string;
    modifiers: StatModifier[] = [];
    dice?: number;
    durationType: DurationType = 'forever';
    combatCount?: number;
    lapCount?: number;
    duration?: string;
    timeDuration?: number;

    static fromResponse(response: EffectResponse, categoriesById: EffectSubCategoryDictionary): Effect {
        let effect = new Effect();
        Object.assign(effect, response, {subCategory: categoriesById[response.subCategoryId]});
        return effect;
    }

    static fromResponses(categoriesById: EffectSubCategoryDictionary, responses: EffectResponse[]): Effect[] {
        return responses.map(response => Effect.fromResponse(response, categoriesById));
    }
}

