import {IDurable, IItemData} from '../api/shared';
import {ItemPartialResponse, ItemResponse} from '../api/responses';
import {IconDescription} from './icon.model';
import {ActiveStatsModifier} from './stat-modifier.model';
import {ItemTemplate} from './item-template.model';
import {IMetadata} from './misc.model';
import {SkillDictionary} from './skill.model';

export class ItemData implements IItemData {
    name: string;
    description?: string;
    quantity?: number;
    icon?: IconDescription;
    charge?: number;
    ug?: number;
    equiped?: number;
    readCount?: number;
    notIdentified?: boolean;
    ignoreRestrictions?: boolean;
    lifetime?: IDurable;
    shownToGm?: boolean;

    constructor(data?: IItemData) {
        if (data) {
            Object.assign(this, data);
        }
    }
}

export class ItemComputedData {
    incompatible?: boolean;
    modifierBonusDamage?: number;
}

export class Item {
    id: number;
    data: ItemData = new ItemData();
    modifiers: ActiveStatsModifier[];
    containerId?: number;
    template: ItemTemplate;
    computedData: ItemComputedData = new ItemComputedData();

    // Generated field
    content?: Item[];
    containerInfo?: IMetadata;

    static fromResponse(response: ItemResponse, skillsById: SkillDictionary): Item {
        let item = new Item();
        Object.assign(item, response, {
            template: ItemTemplate.fromResponse(response.template, skillsById),
            modifiers: ActiveStatsModifier.modifiersFromJson(response.modifiers)
        });
        return item;
    }

    static itemsFromJson(responses: ItemResponse[], skillsById: SkillDictionary): Item[] {
        return responses.map(response => Item.fromResponse(response, skillsById));
    }

    get price(): number | undefined {
        if (!this.template.data.price) {
            return undefined;
        }

        let priceFactor = 1;
        if (this.data.quantity) {
            priceFactor = this.data.quantity;
        } else if (this.template.data.useUG) {
            priceFactor = this.data.ug || 1;
        }

        return this.template.data.price * priceFactor;
    }

    get shouldBePutInAContainer(): boolean {
        if (this.data.equiped) {
            return false
        }
        if (this.containerId) {
            return false;
        }
        if (this.template.data.container) {
            return false;
        }
        return true;
    }

    public getDamageString(): string {
        let damage = '';
        if (this.template.data.damageDice) {
            damage += this.template.data.damageDice + 'D';
        }
        if (this.template.data.bonusDamage) {
            if (damage) {
                damage += '+';
            }
            damage += this.template.data.bonusDamage;
        }
        if (this.template.data.damageType) {
            damage += '(' + this.template.data.damageType + ')';
        }
        return damage;
    }

    public getRollFormula(): string {
        let formula = '';
        if (this.template.data.damageDice) {
            formula += this.template.data.damageDice + 'd6';
        }
        if (this.template.data.bonusDamage) {
            if (formula) {
                formula += '+';
            }
            formula += this.template.data.bonusDamage;
        }
        return formula;
    }
}

export class PartialItem {
    id: number;
    data: ItemData = new ItemData();
    modifiers: ActiveStatsModifier[];
    containerId: number;

    static fromResponse(response: ItemPartialResponse): PartialItem {
        let item = new PartialItem();
        Object.assign(item, response, {modifiers: ActiveStatsModifier.modifiersFromJson(response.modifiers)});
        return item;
    }
}
