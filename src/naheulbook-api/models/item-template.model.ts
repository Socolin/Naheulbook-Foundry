import {IDurable, IItemTemplateData, IItemTemplateGunData, IItemTemplateInstrumentData} from '../api/shared';
import {
    ItemTemplateResponse,
    ItemTemplateSectionResponse,
    ItemTemplateSubCategoryResponse,
    ItemTypeResponse
} from '../api/responses';
import {Guid} from '../api/shared/util';
import {Skill, SkillDictionary} from './skill.model';
import {IconDescription} from './icon.model';
import {ItemStatModifier} from './stat-modifier.model';

export class ItemTemplateSection {
    id: number;
    name: string;
    note: string;
    specials: string[];
    icon: string;
    subCategories: ItemTemplateSubCategory[];

    private static fromResponse(response: ItemTemplateSectionResponse): ItemTemplateSection {
        const itemSection = new ItemTemplateSection();
        itemSection.id = response.id;
        itemSection.name = response.name;
        itemSection.note = response.note;
        itemSection.specials = response.specials;
        itemSection.icon = response.icon;
        itemSection.subCategories = ItemTemplateSubCategory.fromResponses(response.subCategories, itemSection);
        return itemSection;
    }

    static fromResponses(responses: ItemTemplateSectionResponse[]): ItemTemplateSection[] {
        return responses.map(response => ItemTemplateSection.fromResponse(response));
    }
}

export type ItemTemplateSubCategoryDictionary = { [subCategoryId: number]: ItemTemplateSubCategory };

export class ItemTemplateSubCategory {
    id: number;
    name: string;
    description: string;
    note: string;
    section: ItemTemplateSection;
    sectionId: number;

    static fromResponses(
        responses: ItemTemplateSubCategoryResponse[],
        itemTemplateSection: ItemTemplateSection
    ): ItemTemplateSubCategory[] {
        return responses.map(response => ItemTemplateSubCategory.fromResponse(response, itemTemplateSection));
    }

    private static fromResponse(
        response: ItemTemplateSubCategoryResponse,
        itemTemplateSection: ItemTemplateSection
    ): ItemTemplateSubCategory {
        const itemTemplateSubCategory = new ItemTemplateSubCategory();
        itemTemplateSubCategory.id = response.id;
        itemTemplateSubCategory.name = response.name;
        itemTemplateSubCategory.description = response.description;
        itemTemplateSubCategory.note = response.note;
        itemTemplateSubCategory.sectionId = response.sectionId;
        itemTemplateSubCategory.section = itemTemplateSection;
        return itemTemplateSubCategory;
    }
}

export class ItemSlot {
    id: number;
    name: string;
    techName: string;
}

export class ItemTemplateGunData implements IItemTemplateGunData {
    range: string;
    damages: string;
    special: string;
    rateOfFire: string;
    reloadDelay: string;
    shootTest: string;
    fuelPerShot: string;
    ammunitionPerShot: string;
    workLuck: string;

    static fromResponse(response?: IItemTemplateGunData): ItemTemplateGunData | undefined {
        if (!response) {
            return undefined;
        }
        let gunData = new ItemTemplateGunData();
        Object.assign(gunData, response);
        return gunData;
    }
}

export class ItemTemplateInstrumentData implements IItemTemplateInstrumentData {
    specialMove?: number;
    speechTheater?: number;
    jugglingDance?: number;
    musicSinging?: number;

    static fromResponse(response?: IItemTemplateInstrumentData): ItemTemplateInstrumentData | undefined {
        if (!response) {
            return undefined;
        }
        let instrumentData = new ItemTemplateInstrumentData();
        Object.assign(instrumentData, response);
        return instrumentData;
    }
}

export class ItemTemplateData implements IItemTemplateData {
    actions?: any[];
    availableLocation?: string;
    bonusDamage?: number;
    bruteWeapon?: boolean;
    charge?: number;
    container?: boolean;
    damageDice?: number;
    damageType?: any;
    description?: string;
    diceDrop?: number;
    enchantment?: string;
    god?: string;
    gun?: ItemTemplateGunData;
    icon?: IconDescription;
    isCurrency?: boolean;
    itemTypes?: string[];
    instrument?: ItemTemplateInstrumentData;
    lifetime?: IDurable;
    magicProtection?: number;
    note?: string;
    notIdentifiedName?: string;
    origin?: string;
    price?: number;
    protection?: number;
    protectionAgainstMagic?: any;
    protectionAgainstType?: any;
    quantifiable?: boolean;
    rarityIndicator?: string;
    relic?: boolean;
    requireLevel?: number;
    rupture?: number;
    sex?: string;
    skillBook?: boolean;
    space?: string;
    throwable?: boolean;
    useUG?: boolean;
    weight?: number;

    static fromJson(response: IItemTemplateData): ItemTemplateData {
        let itemTemplateData = new ItemTemplateData();
        Object.assign(itemTemplateData, response, {
            gun: ItemTemplateGunData.fromResponse(response.gun),
            instrument: ItemTemplateInstrumentData.fromResponse(response.instrument)
        });
        return itemTemplateData;
    }

    isItemTypeName(itemTypeName: string): boolean {
        if (!this.itemTypes) {
            return false;
        }
        let i = this.itemTypes.findIndex(name => name === itemTypeName);
        return i !== -1;
    }

    isItemType(itemType: ItemTypeResponse): boolean {
        if (!this.itemTypes) {
            return false;
        }
        let i = this.itemTypes.findIndex(name => name === itemType.techName);
        return i !== -1;
    }

    toggleItemType(itemType: ItemTypeResponse): void {
        if (!this.itemTypes) {
            this.itemTypes = [];
        }
        if (this.isItemType(itemType)) {
            let i = this.itemTypes.findIndex(name => name === itemType.techName);
            if (i !== -1) {
                this.itemTypes.splice(i, 1);
            }
        } else {
            this.itemTypes.push(itemType.techName);
        }
    }
}

export class ItemSkillModifier {
    skill: Skill;
    value: number;

    constructor(skill: Skill, value: number) {
        this.skill = skill;
        this.value = value;
    }
}

export class ItemTemplate {
    id: Guid;
    name: string;
    techName?: string;
    subCategoryId: number;
    data: ItemTemplateData = new ItemTemplateData();
    source: 'official' | 'community' | 'private';
    sourceUser?: string;
    sourceUserId?: number;
    modifiers: ItemStatModifier[] = [];
    skills: Skill[] = [];
    unSkills: Skill[] = [];
    slots: ItemSlot[] = [];
    requirements: {
        stat: string;
        min?: number;
        max?: number;
    }[] = [];
    skillModifiers: ItemSkillModifier[];

    static hasSlot(template: ItemTemplate, slotName: string): boolean {
        if (!template.slots) {
            return false;
        }
        for (let i = 0; i < template.slots.length; i++) {
            let slot = template.slots[i];
            if (slot == null) {
                continue;
            }
            if (template.slots[i].techName === slotName) {
                return true;
            }
        }
        return false;
    }

    static fromResponse(response: ItemTemplateResponse, skillsById: SkillDictionary): ItemTemplate {
        let itemTemplate = new ItemTemplate();
        Object.assign(itemTemplate, response, {
            skills: [],
            unSkills: [],
            skillModifiers: [],
            data: ItemTemplateData.fromJson(response.data)
        });

        for (let skillId of response.skillIds) {
            itemTemplate.skills.push(skillsById[skillId]);
        }
        for (let skillId of response.unSkillIds) {
            itemTemplate.unSkills.push(skillsById[skillId]);
        }

        for (let skillModifier of response.skillModifiers) {
            itemTemplate.skillModifiers.push(new ItemSkillModifier(skillsById[+skillModifier.skillId], skillModifier.value));
        }

        return itemTemplate;
    }

    static fromResponses(responses: ItemTemplateResponse[], skillsById: SkillDictionary): ItemTemplate[] {
        return responses.map(response => ItemTemplate.fromResponse(response, skillsById));
    }

    isInSlot(slot: ItemSlot): boolean {
        if (!this.slots) {
            return false;
        }
        let i = this.slots.findIndex(s => s.id === slot.id);
        return i !== -1;
    }
}
