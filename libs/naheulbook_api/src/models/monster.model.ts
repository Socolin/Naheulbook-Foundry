import {Subject} from 'rxjs';

import {MonsterSubCategoryResponse, MonsterResponse, MonsterTemplateResponse, MonsterTypeResponse} from '../api/responses';
import {IMonsterData, MonsterTemplateData} from '../api/shared';
import {Item, PartialItem} from './item.model';
import {ActiveStatsModifier, StatModifier} from './stat-modifier.model';
import {SkillDictionary} from './skill.model';
import {IMetadata} from './misc.model';
import {JobDictionary} from './job.model';
import {ItemTemplate} from './item-template.model';

export class MonsterData implements IMonsterData {
    at: number;
    prd?: number;
    esq?: number;
    ev: number;
    maxEv: number;
    ea: number;
    maxEa: number;
    pr: number;
    pr_magic: number;
    dmg: string;
    cou: number;
    chercheNoise: boolean;
    resm: number;
    xp: number;
    note: string;
    color = '000000';
    number: number;
    sex?: string;
    page?: number;

    static fromJson(jsonData: IMonsterData): MonsterData {
        let monsterData = new MonsterData();
        Object.assign(monsterData, jsonData);
        return monsterData;
    }

    constructor(monsterData?: MonsterData) {
        if (monsterData) {
            Object.assign(this, monsterData);
        }
    }
}


export class MonsterComputedData {
    at: number;
    prd: number;
    esq: number;
    pr: number;
    pr_magic: number;
    dmg: { name: string, damage: string, incompatible?: boolean }[] = [];
    cou: number;
    chercheNoise: boolean;
    resm: number;
}

export class Monster {
    public id: number;
    public name: string;
    public data: MonsterData = new MonsterData();
    public dead: string;
    public items: Item[] = [];

    public modifiers: ActiveStatsModifier[] = [];

    public itemAdded: Subject<Item> = new Subject<Item>();
    public itemRemoved: Subject<Item> = new Subject<Item>();

    public computedData: MonsterComputedData = new MonsterComputedData();
    public onChange: Subject<any> = new Subject<any>();
    public onUpdate: Subject<Monster> = new Subject<Monster>();
    public onNotification: Subject<any> = new Subject<any>();

    static fromResponse(response: MonsterResponse, skillsById: SkillDictionary): Monster {
        let monster = new Monster();
        Object.assign(monster, response, {
            data: MonsterData.fromJson(response.data),
            items: Item.itemsFromJson(response.items, skillsById),
            modifiers: ActiveStatsModifier.modifiersFromJson(response.modifiers)
        });
        monster.update();
        return monster;
    }

    static fromResponses(responses: MonsterResponse[] | undefined, skillsById: SkillDictionary): Monster[] {
        let monsters: Monster[] = [];

        if (responses) {
            for (let monsterData of responses) {
                monsters.push(Monster.fromResponse(monsterData, skillsById));
            }
        }

        return monsters;
    }

    constructor(monster?: Monster) {
        if (monster) {
            Object.assign(this, monster, {data: new MonsterData(monster.data)});
        }
    }

    public notify(type: string, message: string, data?: any) {
        this.onNotification.next({type: type, message: message, data: data});
    }

    public getItem(itemId: number): Item | undefined {
        let i = this.items.findIndex(item => item.id === itemId);
        if (i !== -1) {
            return this.items[i];
        }
        return undefined;
    }

    /**
     * Add an item to the loot
     * @param addedItem The item to add
     * @returns {boolean} true if the item has been added (false if the item was already in)
     */
    public addItem(addedItem: Item): boolean {
        let i = this.items.findIndex(item => item.id === addedItem.id);
        if (i !== -1) {
            return false;
        }
        this.items.push(addedItem);
        this.itemAdded.next(addedItem);
        this.onChange.next({action: 'addItem', item: addedItem});
        return true;
    }

    /**
     * Delete an item from the loot
     * @param removedItemId The id of the item to remove
     * @returns {boolean} true if item was removed (false if item was not present)
     */
    public removeItem(removedItemId: number): boolean {
        let i = this.items.findIndex(item => item.id === removedItemId);
        if (i !== -1) {
            let removedItem = this.items[i];
            this.items.splice(i, 1);
            this.itemRemoved.next(removedItem);
            this.onChange.next({action: 'removeItem', item: removedItem});
            return true;
        }
        return false;
    }

    public takeItem(itemId: number, remainingQuantity: number | undefined, character: IMetadata) {
        if (remainingQuantity) {
            const item = this.getItem(itemId);
            if (item) {
                item.data.quantity = remainingQuantity;
                this.onChange.next({action: 'tookItem', character: character, item: item});
            }
        } else {
            const item = this.getItem(itemId);
            if (item) {
                let i = this.items.findIndex(it => it.id === itemId);
                if (i !== -1) {
                    let removedItem = this.items[i];
                    this.items.splice(i, 1);
                    this.itemRemoved.next(removedItem);
                }
                this.onChange.next({action: 'tookItem', character: character, item: item});
            }
        }
    }

    public changeData(data: MonsterData) {
        for (let fieldName in data) {
            if (!data.hasOwnProperty(fieldName)) {
                continue;
            }
            if (data[fieldName] !== this.data[fieldName]) {
                this.notify('changeData',
                    'Modification: ' + fieldName.toUpperCase() + ': ' + this.data[fieldName] + ' -> ' + data[fieldName],
                    {fieldName: fieldName, value: data[fieldName]});
                this.onChange.next({action: 'changeData', fieldName: fieldName, value: data[fieldName]});
            }
        }
        this.data = data;
        this.update();
    }

    onAddModifier(modifier: ActiveStatsModifier) {
        for (let i = 0; i < this.modifiers.length; i++) {
            if (this.modifiers[i].id === modifier.id) {
                return;
            }
        }
        this.modifiers.push(modifier);
        this.update();
        this.notify('addModifier', 'Ajout du modificateur: ' + modifier.name);
    }

    onRemoveModifier(modifierId: number) {
        for (let i = 0; i < this.modifiers.length; i++) {
            let e = this.modifiers[i];
            if (e.id === modifierId) {
                this.modifiers.splice(i, 1);
                this.update();
                this.notify('removeModifier', 'Suppression du modificateur: ' + e.name);
                return;
            }
        }
    }

    onUpdateModifier(modifier: ActiveStatsModifier) {
        for (let i = 0; i < this.modifiers.length; i++) {
            if (this.modifiers[i].id === modifier.id) {
                if (this.modifiers[i].active === modifier.active
                    && this.modifiers[i].currentTimeDuration === modifier.currentTimeDuration
                    && this.modifiers[i].currentLapCount === modifier.currentLapCount
                    && this.modifiers[i].currentCombatCount === modifier.currentCombatCount) {
                    return;
                }
                if (!this.modifiers[i].active && modifier.active) {
                    this.notify('updateModifier', 'Activation du modificateur: ' + modifier.name);
                } else if (this.modifiers[i].active && !modifier.active) {
                    this.notify('updateModifier', 'Désactivation du modificateur: ' + modifier.name);
                } else {
                    this.notify('updateModifier', 'Mis à jour du modificateur: ' + modifier.name);
                }
                this.modifiers[i].active = modifier.active;
                this.modifiers[i].currentCombatCount = modifier.currentCombatCount;
                this.modifiers[i].currentTimeDuration = modifier.currentTimeDuration;
                this.modifiers[i].currentLapCount = modifier.currentLapCount;
                break;
            }
        }
        this.update();
    }

    private applyStatModifier(mod: StatModifier) {
        if (mod.stat === 'AT') {
            this.computedData.at = StatModifier.apply(this.computedData.at, mod);
        }
        if (mod.stat === 'PRD' && this.computedData.prd !== undefined) {
            this.computedData.prd = StatModifier.apply(this.computedData.prd, mod);
        }
        if (mod.stat === 'AD') {
            this.computedData.esq = StatModifier.apply(this.computedData.esq, mod);
        }
        if (mod.stat === 'ESQ') {
            this.computedData.esq = StatModifier.apply(this.computedData.esq, mod);
        }
        if (mod.stat === 'PR') {
            this.computedData.pr = StatModifier.apply(this.computedData.pr, mod);
        }
        if (mod.stat === 'PR_MAGIC') {
            this.computedData.pr_magic = StatModifier.apply(this.computedData.pr_magic, mod);
        }
        if (mod.stat === 'RESM') {
            this.computedData.cou = StatModifier.apply(this.computedData.resm, mod);
        }
    }

    equipItem(partialItem: PartialItem) {
        let item = this.getItem(partialItem.id);
        if (!item) {
            return;
        }
        if (item.data.equiped === partialItem.data.equiped) {
            return;
        }
        item.data.equiped = partialItem.data.equiped;
        this.update();
    }

    update() {
        this.computedData.at = this.data.at;
        this.computedData.prd = this.data.prd ? this.data.prd : 0;
        this.computedData.esq = this.data.esq ? this.data.esq : 0;
        this.computedData.pr = this.data.pr;
        this.computedData.pr_magic = this.data.pr_magic;
        if (!this.computedData.pr_magic) {
            this.computedData.pr_magic = 0;
        }
        this.computedData.dmg = [{name: 'base', damage: this.data.dmg}];
        this.computedData.cou = this.data.cou;
        this.computedData.chercheNoise = this.data.chercheNoise;
        this.computedData.resm = this.data.resm;

        for (let activeModifier of this.modifiers) {
            if (activeModifier.active) {
                for (let mod of activeModifier.values) {
                    this.applyStatModifier(mod);
                }
            }
        }
        for (let item of this.items) {
            if (item.data.equiped) {
                this.computedData.dmg.push({
                    name: item.data.name || item.template.name,
                    damage: item.getDamageString()
                });
            }
            if (item.data.equiped && item.template.modifiers) {
                for (let mod of item.template.modifiers) {
                    this.applyStatModifier(mod);
                }
            }
        }
        this.onUpdate.next(this);
    }

    public getWsTypeName(): string {
        return 'monster';
    }

    dispose() {
        this.itemAdded.unsubscribe();
        this.itemRemoved.unsubscribe();
        this.onNotification.unsubscribe();
        this.onChange.unsubscribe();
    }

    handleWebsocketEvent(opcode: string, data: any, database: {skillsById: SkillDictionary, jobsById: JobDictionary}) {
        switch (opcode) {
            case 'addItem': {
                this.addItem(Item.fromResponse(data, database.skillsById));
                break;
            }
            case 'deleteItem': {
                this.removeItem(data);
                break;
            }
            case 'tookItem': {
                this.takeItem(data.originalItem.id, data.remainingQuantity, data.character);
                break;
            }
            case 'changeName': {
                this.name = data;
                break;
            }
            case 'changeTarget': {
                break;
            }
            case 'changeData': {
                this.changeData(MonsterData.fromJson(data));
                break;
            }
            case 'addModifier': {
                this.onAddModifier(ActiveStatsModifier.fromJson(data));
                break;
            }
            case 'removeModifier': {
                this.onRemoveModifier(data);
                break;
            }
            case 'updateModifier': {
                this.onUpdateModifier(ActiveStatsModifier.fromJson(data));
                break;
            }
            case 'equipItem': {
                this.equipItem(PartialItem.fromResponse(data));
                break;
            }
            default: {
                console.warn('Opcode not handle: `' + opcode + '`');
                break;
            }
        }
    }
}

export class MonsterInventoryElement {
    id: number;
    itemTemplate: ItemTemplate;
    minCount: number;
    maxCount: number;
    chance: number;
    hidden: boolean;
    minUg?: number;
    maxUg?: number;
}

export class TraitInfo {
    traitId: number;
    level: number;

    constructor(id: number, level: number) {
        this.traitId = id;
        this.level = level;
    }
}

export type MonsterTemplateSubCategoryDictionary = { [id: number]: MonsterTemplateSubCategory };

export class MonsterTemplateSubCategory {
    id: number;
    name: string;
    type: MonsterTemplateType;

    static fromResponse(
        response: MonsterSubCategoryResponse,
        type: { [id: number]: MonsterTemplateType } | MonsterTemplateType
    ): MonsterTemplateSubCategory {
        let subCategory = new MonsterTemplateSubCategory();
        if (type instanceof MonsterTemplateType) {
            Object.assign(subCategory, response, {type: type});
        } else {
            Object.assign(subCategory, response, {type: type[response.typeid]});
        }
        return subCategory;
    }

    static categoriesFromJson(responses: MonsterSubCategoryResponse[], type: MonsterTemplateType): MonsterTemplateSubCategory[] {
        let subCategories: MonsterTemplateSubCategory[] = [];

        for (let jsonData of responses) {
            subCategories.push(MonsterTemplateSubCategory.fromResponse(jsonData, type));
        }

        return subCategories;
    }
}

export class MonsterTemplateType {
    id: number;
    name: string;
    subCategories: MonsterTemplateSubCategory[] = [];

    static fromResponse(response: MonsterTypeResponse): MonsterTemplateType {
        let type = new MonsterTemplateType();
        Object.assign(type, response, {subCategories: MonsterTemplateSubCategory.categoriesFromJson(response.subCategories, type)});
        return type;
    }

    static typesFromJson(jsonDatas: MonsterTypeResponse[]): MonsterTemplateType[] {
        let types: MonsterTemplateType[] = [];
        for (let jsonData of jsonDatas) {
            types.push(MonsterTemplateType.fromResponse(jsonData));
        }
        return types;
    }
}


export class MonsterTemplate {
    id: number;
    name: string;
    data: MonsterTemplateData;
    subCategoryId: number;
    subCategory: MonsterTemplateSubCategory;
    inventory: MonsterInventoryElement[];

    static fromResponse(
        response: MonsterTemplateResponse,
        subCategoriesById: MonsterTemplateSubCategoryDictionary,
        skillsById: SkillDictionary
    ): MonsterTemplate {
        const subCategory = subCategoriesById[response.subCategoryId];
        const inventory: MonsterInventoryElement[] = [];
        for (let inventoryElement of response.inventory) {
            let element = {
                ...inventoryElement,
                itemTemplate: ItemTemplate.fromResponse(inventoryElement.itemTemplate, skillsById)
            };
            inventory.push(element);
        }

        return new MonsterTemplate(response.id, response.name, subCategory, response.data, inventory);
    }

    static templatesFromResponse(
        responses: MonsterTemplateResponse[],
        categoriesById: MonsterTemplateSubCategoryDictionary,
        skillsById: SkillDictionary
    ): MonsterTemplate[] {
        return responses.map(response => MonsterTemplate.fromResponse(response, categoriesById, skillsById));
    }

    constructor(
        id: number,
        name: string,
        subCategory: MonsterTemplateSubCategory,
        data: MonsterTemplateData,
        inventory: MonsterInventoryElement[]
    ) {
        this.id = id;
        this.name = name;
        this.subCategory = subCategory;
        this.subCategoryId = subCategory.id; // FIXME: still needed ?
        this.data = data;
        this.inventory = inventory;
    }
}

export type MonsterTraitDictionary = { [id: number]: MonsterTrait };

export class MonsterTrait {
    id: number;
    name: string;
    description: string;
    levels?: string[];
}
