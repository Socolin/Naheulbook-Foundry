import {
    CharacterFoGmResponse, CharacterGroupInviteResponse, CharacterGroupResponse,
    CharacterLevelUpResponse,
    CharacterResponse,
    ItemPartialResponse
} from '../api/responses';
import {CharacterSex} from '../api/shared/enums';
import {Guid} from '../api/shared/util';
import {Skill, SkillDictionary} from './skill.model';
import {Item, PartialItem} from './item.model';
import {ItemSlot, ItemTemplate} from './item-template.model';
import {ActiveStatsModifier, formatModifierValue, ItemStatModifier, StatModifier} from './stat-modifier.model';
import {FlagData} from './flag.model';
import {Origin} from './origin.model';
import {Job, JobDictionary} from './job.model';
import {Speciality} from './speciality.model';
import {Subject} from 'rxjs';

export interface CharacterGiveDestination {
    id: number;
    name: string;
    isNpc: boolean;
}

export interface SkillDetail {
    from: string[];
    skillDef: Skill;
    canceled?: string;
}

export class StaticDetailShow {
    evea = false;
    atprd = false;
    stat = false;
    other = false;
    magic = false;
}

export class StatisticDetail {
    evea: any[] = [];
    atprd: any[] = [];
    stat: any[] = [];
    magic: any[] = [];
    other: any[] = [];
    show: StaticDetailShow = new StaticDetailShow();

    static getDetailCategoryForStat(statName: string) {
        if (statName === 'EV' || statName === 'EA') {
            return 'evea';
        }
        if (statName === 'AT' || statName === 'PRD' || statName === 'PR' || statName === 'PR_MAGIC') {
            return 'atprd';
        }
        if (statName === 'COU'
            || statName === 'FO'
            || statName === 'AD'
            || statName === 'CHA'
            || statName === 'INT') {
            return 'stat';
        }
        if (statName === 'MV'
            || statName === 'THROW_MODIFIER'
            || statName === 'DISCRETION_MODIFIER'
            || statName === 'DANSE_MODIFIER'
            || statName === 'PI') {
            return 'other';
        }
        if (statName === 'RESM'
            || statName === 'MPSY'
            || statName === 'MPHYS') {
            return 'magic';
        }
        return 'unk';
    }

    init() {
        this.evea = [];
        this.atprd = [];
        this.stat = [];
        this.magic = [];
        this.other = [];
    }

    add(name: string, data: {[statName: string]: any}) {
        let subCategories: {[subCategoryName: string]: any} = {};
        for (let i in data) {
            if (!data.hasOwnProperty(i)) {
                continue;
            }
            let category = StatisticDetail.getDetailCategoryForStat(i);
            if (!this[category]) {
                this[category] = [];
            }
            subCategories[category] = 1;
        }
        for (let i in subCategories) {
            if (!subCategories.hasOwnProperty(i)) {
                continue;
            }
            if (i === 'evea') {
                this.evea.push({
                    name: name,
                    data: {
                        EV: data['EV'],
                        EA: data['EA']
                    }
                });
            }
            if (i === 'atprd') {
                this.atprd.push({
                    name: name,
                    data: {
                        AT: data['AT'],
                        PRD: data['PRD'],
                        PR: data['PR'],
                        PR_MAGIC: data['PR_MAGIC']
                    }
                });
            }
            if (i === 'stat') {
                this.stat.push({
                    name: name,
                    data: {
                        COU: data['COU']
                        , FO: data['FO']
                        , CHA: data['CHA']
                        , AD: data['AD']
                        , INT: data['INT']
                    }
                });
            }
            if (i === 'other') {
                this.other.push({
                    name: name,
                    data: {
                        MV: data['MV']
                        , THROW_MODIFIER: data['THROW_MODIFIER']
                        , DISCRETION_MODIFIER: data['DISCRETION_MODIFIER']
                        , DANSE_MODIFIER: data['DANSE_MODIFIER']
                        , PI: data['PI']
                    }
                });
            }
            if (i === 'magic') {
                this.magic.push({
                    name: name,
                    data: {
                        MPHYS: data['MPHYS']
                        , MPSY: data['MPSY']
                        , RESM: data['RESM']
                    }
                });
            }
        }
    }
}

export class TacticalMovementInfo {
    distance: number;
    maxDuration: number;
    sprintDistance: number;
    sprintMaxDuration: number;
}

export class CharacterComputedData {
    baseStat: {[statName: string]: number} = {};
    stats: {[statName: string]: number} = {};
    skills: SkillDetail[] = [];
    containers: Item[];
    details: StatisticDetail = new StatisticDetail();

    itemsBySlots: {[slotId: number]: Item[]} = {};
    itemsBySlotsAll = {};
    itemsEquiped: Item[] = [];
    notIdentifiedItems: Item[] = [];
    currencyItems: Item[] = [];
    totalMoney = 0;
    itemSlots: ItemSlot[] = [];
    topLevelContainers: Item[] = [];
    xpToNextLevel: number;
    tacticalMovement: TacticalMovementInfo = new TacticalMovementInfo();

    modifiers: ActiveStatsModifier[] = [];

    countExceptionalStats = 0;
    countActiveEffect = 0;
    weaponsDamages: {name: string, damage: string, incompatible?: boolean}[] = [];
    flags: {[flagName: string]: FlagData[]} = {};
    shownItemsToGm: Item[] = [];

    init() {
        this.details.init();

        this.itemsBySlots = {};
        this.itemsBySlotsAll = {};
        this.itemsEquiped = [];
        this.itemSlots = [];
        this.topLevelContainers = [];
        this.containers = [];
        this.skills = [];
        this.modifiers = [];
        this.tacticalMovement = new TacticalMovementInfo();
        this.flags = {};
    }
}

export class PrimaryStat {
    AD: number;
    CHA: number;
    COU: number;
    FO: number;
    INT: number;

    [statName: string]: number;

    static fromResponse(response: { AD: number; COU: number; CHA: number; FO: number; INT: number; }): PrimaryStat {
        const primaryStats = new PrimaryStat();
        primaryStats.AD = response.AD;
        primaryStats.CHA = response.CHA;
        primaryStats.COU = response.COU;
        primaryStats.FO = response.FO;
        primaryStats.INT = response.INT;
        return primaryStats;
    }
}

export class Character {
    id: number;
    name: string;
    ev: number;
    ea: number;
    origin: Origin;
    jobs: Job[];
    level: number;
    sex: CharacterSex;
    experience: number;
    active: number;
    fatePoint: number;
    items: Item[] = [];
    skills: Skill[] = [];
    stats: PrimaryStat;
    modifiers: ActiveStatsModifier[] = [];
    specialities: Speciality[] = [];
    statBonusAD: string;
    user: Object;
    color: string;
    gmData: any;
    group?: CharacterGroupResponse;
    invites: CharacterGroupInviteResponse[];
    isNpc: boolean;

    computedData: CharacterComputedData = new CharacterComputedData();
    onUpdate: Subject<Character> = new Subject<Character>();

    static fromResponse(
        response: CharacterResponse | CharacterFoGmResponse,
        origins: Origin[],
        jobs: Job[],
        skillsById: SkillDictionary
    ): Character {
        let character = new Character();
        Object.assign(character, response, {
            skills: [],
            items: [],
            modifiers: ActiveStatsModifier.modifiersFromJson(response.modifiers),
            specialities: Speciality.fromResponses(response.specialities)
        });

        const origin = origins.find(o => o.id === response.originId);
        if (!origin) {
            throw new Error('Invalid origin id. Origin was not found in database: ' + response.originId);
        }
        character.origin = origin;
        character.jobs = response.jobIds.map(jobId => jobs.find(j => j.id === jobId)!).filter(job => !!job);
        character.skills = response.skillIds.map(skillId => skillsById[skillId]).filter(skill => !!skill);
        character.items = response.items.map(itemResponse => Item.fromResponse(itemResponse, skillsById));
        character.stats = PrimaryStat.fromResponse(response.stats);

        return character;
    }

    hasJob(job: Guid | Job): boolean {
        if (job instanceof Job) {
            return this.jobs.findIndex(j => j.id === job.id) !== -1;
        }
        return this.jobs.findIndex(j => j.id === job) !== -1;
    }

    hasMagic(): boolean {
        return 'EA' in this.computedData.stats && this.computedData.stats['EA'] > 0;
    }

    hasMagicJob(): boolean {
        return this.jobs.findIndex(j => j.isMagic) !== -1;
    }

    get diceEaLevelUp(): number | undefined {
        let job = this.jobs.find(j => j.isMagic);
        if (!job) {
            return undefined;
        }
        return job.getStatData(this.origin).diceEaLevelUp;
    }

    hasFlag(flagName: string): boolean {
        return (flagName in this.computedData.flags);
    }

    getFlagDatas(flagName: string): FlagData[] | undefined {
        if (this.hasFlag(flagName)) {
            return this.computedData.flags[flagName];
        }
        return undefined;
    }

    // Concatenate modifiers like [-2 PRD] and [+2 PRD for dwarf]
    private cleanItemModifiers(item: Item): ItemStatModifier[] {
        let cleanModifiers: ItemStatModifier[] = [];
        if (item.template.modifiers) {
            for (let i = 0; i < item.template.modifiers.length; i++) {
                let modifier = item.template.modifiers[i];
                if (modifier.jobId && !this.hasJob(modifier.jobId )) {
                    continue;
                }
                if (modifier.originId && modifier.originId !== this.origin.id) {
                    continue;
                }
                let newModifier = JSON.parse(JSON.stringify(modifier));
                for (let j = 0; j < cleanModifiers.length; j++) {
                    let newMod = cleanModifiers[j];
                    if (newModifier.stat === newMod.stat
                        && newModifier.type === newMod.type
                        && (!newModifier.special || newModifier.special.length === 0)
                        && (!newMod.special || newMod.special.length === 0)) {
                        newMod.value += newModifier.value;
                        newModifier = null;
                        break;
                    }
                }
                if (newModifier) {
                    cleanModifiers.push(newModifier);
                }
            }
        }
        return cleanModifiers;
    }

    getXpForNextLevel() {
        let level = 1;
        let totalXp = 0;
        let xp = this.experience;
        while (xp >= level * 100) {
            xp -= level * 100;
            totalXp += level * 100;
            level++;
        }

        totalXp += level * 100;

        return totalXp;
    }

    private updateInventory() {
        let itemsBySlots = {};
        let itemsBySlotsAll = {};
        let equiped: Item[] = [];
        let notIdentified: Item[] = [];
        let slots: ItemSlot[] = [];
        let containers: Item[] = [];
        let topLevelContainers: Item[] = [];
        let currencyItems: Item[] = [];
        let shownItemsToGm: Item[] = [];
        let totalMoney = 0;
        let content: {[itemId: number]: Item[]} = {};
        let itemsById: {[itemId: number]: Item} = {};

        for (let item of this.items) {
            if (item.data.shownToGm) {
                shownItemsToGm.push(item);
            }
            if (item.template.data.isCurrency && item.template.data.price != null) {
                totalMoney += item.template.data.price * (item.data.quantity || 1);
                currencyItems.push(item);
            }

            itemsById[item.id] = item;
            if (item.data.equiped || item.containerId !== null) {
                if (item.template.data.container) {
                    if (item.data.equiped) {
                        topLevelContainers.push(item);
                    }
                    containers.push(item);
                }
            }

            for (let s = 0; s < item.template.slots.length; s++) {
                let slot = item.template.slots[s];
                if (!itemsBySlotsAll[slot.id]) {
                    itemsBySlotsAll[slot.id] = [];
                }
                itemsBySlotsAll[slot.id].push(item);

                if (!item.data.equiped) {
                    continue;
                }

                if (!itemsBySlots[slot.id]) {
                    itemsBySlots[slot.id] = [];
                }
                if (!itemsBySlots[slot.id].length) {
                    slots.push(slot);
                }
                itemsBySlots[slot.id].push(item);
            }

            if (item.data.equiped) {
                equiped.push(item);
            } else {
                if (item.containerId) {
                    if (!content[item.containerId]) {
                        content[item.containerId] = [];
                    }
                    content[item.containerId].push(item);
                }
            }

            if (item.data.notIdentified) {
                notIdentified.push(item);
            }
        }

        for (let item of this.items) {
            if (item.containerId) {
                const container = itemsById[item.containerId];
                if (container) {
                    item.containerInfo = {
                        name: container.data.name || container.template.name,
                        id: container.id
                    };
                }
            }
            if (item.id in content) {
                item.content = content[item.id];
            }
        }

        for (let slot of slots) {
            itemsBySlots[slot.id].sort(function (a: Item, b: Item) {
                if (a.data.equiped === b.data.equiped) {
                    return 0;
                }

                if (a.data.equiped && b.data.equiped) {
                    if (a.data.equiped < b.data.equiped) {
                        return 1;
                    }
                    return -1;
                } else if (b.data.equiped) {
                    return 1;
                } else {
                    return -1;
                }
            });
        }

        for (let container of containers) {
            if (container.content) {
                container.content.sort((a, b) => {
                    if (a.template.data.container === b.template.data.container) {
                        return 0;
                    }
                    if (a.template.data.container) {
                        return -1;
                    }
                    if (b.template.data.container) {
                        return 1;
                    }
                    return 0;
                });
            }
        }

        this.computedData.xpToNextLevel = this.getXpForNextLevel();
        this.computedData.itemsEquiped = equiped;
        this.computedData.notIdentifiedItems = notIdentified;
        this.computedData.itemSlots = slots;
        this.computedData.itemsBySlots = itemsBySlots;
        this.computedData.itemsBySlotsAll = itemsBySlotsAll;
        this.computedData.containers = containers;
        this.computedData.topLevelContainers = topLevelContainers;
        this.computedData.currencyItems = currencyItems;
        this.computedData.totalMoney = totalMoney;
        this.computedData.shownItemsToGm = shownItemsToGm;
    }

    private updateFlags() {
        let flags: {[flagName: string]: FlagData[]} = {};

        this.origin.getFlagsDatas(flags);
        this.jobs.forEach(j => j.getFlagsDatas(flags));
        if (this.specialities) {
            for (let speciality of this.specialities) {
                speciality.getFlagsDatas(flags);
            }
        }

        for (let s of this.computedData.skills) {
            if (s.canceled) {
                continue;
            }
            s.skillDef.getFlagsDatas(flags);
        }

        this.computedData.flags = flags;
    }

    public getJobsSpecialities(job: Job): Speciality[] {
        let specialities: Speciality[] = [];

        for (let speciality of job.specialities) {
            if (this.specialities.findIndex(s => s.id === speciality.id) !== -1) {
                specialities.push(speciality);
            }
        }
        return specialities;
    }


    public checkItemIncompatibilities(item: Item): {reason: string, source?: {type: string, name: string}}[] | undefined {
        let incompatibilities: {reason: string, source?: {type: string, name: string}}[] = [];

        if (item.template.data.god) {
            let relatedGods = this.getFlagDatas('RELATED_GOD');
            if (relatedGods) {
                let foundGod = false;
                for (let relatedGod of relatedGods) {
                    if (item.template.data.god === relatedGod.data) {
                        foundGod = true;
                        break;
                    }
                }
                if (!foundGod) {
                    incompatibilities.push({reason: 'bad_god'});
                }
            }
            else {
                incompatibilities.push({reason: 'no_god'});
            }
        }

        if (item.template.data.sex) {
            if (item.template.data.sex === 'h' && this.sex !== 'Homme') {
                incompatibilities.push({reason: 'bad_sex_h'});
            }
            if (item.template.data.sex === 'f' && this.sex !== 'Femme') {
                incompatibilities.push({reason: 'bad_sex_f'});
            }
        }

        if (item.template.requirements) {
            for (let requirement of item.template.requirements) {
                if (requirement.max && this.computedData.stats[requirement.stat] > requirement.max) {
                    incompatibilities.push({reason: 'stat_to_high', source: {type: 'stat', name: requirement.stat}});
                }
                if (requirement.min && this.computedData.stats[requirement.stat] < requirement.min) {
                    incompatibilities.push({reason: 'stat_to_low', source: {type: 'stat', name: requirement.stat}});
                }
            }
        }
        if (item.template.data.bruteWeapon) {
            if (!this.hasFlag('ARME_BOURRIN')) {
                incompatibilities.push({reason: 'no_arme_bourrin'});
            }
        }

        if (item.template.data.requireLevel) {
            if (this.level < item.template.data.requireLevel) {
                incompatibilities.push({reason: 'too_low_level'});
            }
        }

        if (item.template.data.enchantment) {
            if (ItemTemplate.hasSlot(item.template, 'WEAPON')) {
                let flag = this.getFlagDatas('NO_MAGIC_WEAPON');
                if (flag) {
                    incompatibilities.push({reason: 'no_magic_weapon', source: flag[0].source});
                }
            }
            else if (item.template.slots && item.template.slots.length) {
                let flag = this.getFlagDatas('NO_MAGIC_ARMOR');
                if (flag) {
                    incompatibilities.push({reason: 'no_magic_armor', source: flag[0].source});
                }
            }
            else {
                let flag = this.getFlagDatas('NO_MAGIC_OBJECT');
                if (flag) {
                    incompatibilities.push({reason: 'no_magic_object', source: flag[0].source});
                }
            }
        }
        if (item.template.data.itemTypes) {
            const noWeaponTypes = this.getFlagDatas('NO_WEAPON_TYPE');
            if (noWeaponTypes) {
                for (let itemType of item.template.data.itemTypes) {
                    for (let noWeaponType of noWeaponTypes) {
                        if (itemType === noWeaponType.data) {
                            incompatibilities.push({reason: 'bad_equipment_type', source: noWeaponType.source});
                        }
                    }
                }
            }

            if (item.template.data.isItemTypeName('LIVRE')
                && !this.hasFlag('ERUDITION')) {
                incompatibilities.push({reason: 'cant_read'});
            }
        }

        if (incompatibilities.length) {
            return incompatibilities;
        }
        return undefined;
    }

    private updateStats() {
        this.computedData.countActiveEffect = 0;
        this.computedData.stats = JSON.parse(JSON.stringify(this.stats));
        this.computedData.baseStat = JSON.parse(JSON.stringify(this.stats));
        this.computedData.details.add('Jet de dé initial', this.stats);
        this.computedData.stats['AT'] = 8;
        this.computedData.stats['PRD'] = 10;
        if (this.jobs.length > 0) {
            let job = this.jobs[0].getStatData(this.origin);
            if (job.baseAt) {
                this.computedData.stats['AT'] = job.baseAt;
            }
            if (job.basePrd) {
                this.computedData.stats['PRD'] = job.basePrd;
            }
        }
        this.computedData.stats['MV'] = 100;
        this.computedData.stats['PR'] = 0;
        this.computedData.stats['PR_MAGIC'] = 0;
        this.computedData.stats['RESM'] = 0;
        this.computedData.stats['PI'] = 0;
        if (this.origin.data.speedModifier) {
            this.computedData.stats['MV'] += this.origin.data.speedModifier;
            if (this.origin.data.speedModifier > 0) {
                this.computedData.details.add('Origine', {MV: '+' + this.origin.data.speedModifier + '%'});
            } else {
                this.computedData.details.add('Origine', {MV: this.origin.data.speedModifier + '%'});
            }
        }
        this.computedData.details.add('Valeurs initial', {AT: this.computedData.stats['AT'], PRD: this.computedData.stats['PRD']});
        this.computedData.stats['EV'] = this.origin.data.baseEv;
        this.computedData.stats['EA'] = 0;
        this.computedData.details.add('Origine', {EV: this.origin.data.baseEv});

        if (this.origin) {
            this.computedData.stats['AT'] += this.origin.data.bonusAt || 0;
            this.computedData.stats['PRD'] += this.origin.data.bonusPrd || 0;
            if (this.origin.data.bonusAt || this.origin.data.bonusPrd) {
                this.computedData.details.add('Origine', {AT: this.origin.data.bonusAt, PRD: this.origin.data.bonusPrd});
            }
        }

        for (let i = 0; i < this.jobs.length; i++) {
            const job = this.jobs[i].getStatData(this.origin);
            if (i === 0) {
                if (job.baseEv) {
                    this.computedData.stats['EV'] = job.baseEv;
                    this.computedData.details.add('Métiers (changement de la valeur de base)', {EV: this.origin.data.baseEv});
                }
                if (job.factorEv) {
                    this.computedData.stats['EV'] *= job.factorEv;
                    this.computedData.stats['EV'] = Math.round(this.computedData.stats['EV']);
                    this.computedData.details.add('Métiers (% de vie)', {EV: (Math.round((1 - job.factorEv) * 100)) + '%'});
                }
                if (job.bonusEv) {
                    this.computedData.stats['EV'] += job.bonusEv;
                    this.computedData.details.add('Métiers (bonus de EV)', {EV: job.bonusEv});
                }
            }
            if (job.baseEa && !this.computedData.stats['EA']) {
                this.computedData.details.add('Métiers (EA de base)', {EA: job.baseEa});
                this.computedData.stats['EA'] = job.baseEa;
            }
        }
        for (let speciality of this.specialities) {
            let detailData = {};
            if (speciality.modifiers) {
                for (let j = 0; j < speciality.modifiers.length; j++) {
                    let modifier = speciality.modifiers[j];
                    this.computedData.stats[modifier.stat] += modifier.value;
                    detailData[modifier.stat] = formatModifierValue(modifier);
                }
            }
            this.computedData.details.add('Specialite: ' + speciality.name, detailData);
        }

        for (let modifier of this.modifiers) {
            if (modifier.reusable || modifier.active) {
                this.computedData.modifiers.push(modifier);
            }

            if (!modifier.active) {
                continue;
            }
            if (!modifier.permanent) {
                this.computedData.countActiveEffect++;
            }
            let detailData = {};
            for (let value of modifier.values) {
                if (modifier.permanent) {
                    StatModifier.applyInPlace(this.computedData.baseStat, value);
                }
                StatModifier.applyInPlace(this.computedData.stats, value);
                detailData[value.stat] = formatModifierValue(value);
            }
            this.computedData.details.add(modifier.name, detailData);
        }

        let canceledSkills: {[skillId: number]: Item} = {};
        this.computedData.skills = [];

        this.computedData.stats['THROW_MODIFIER'] = 0;
        this.computedData.stats['DISCRETION_MODIFIER'] = 0;
        this.computedData.stats['DANSE_MODIFIER'] = 0;
        this.computedData.stats['CHA_WITHOUT_MAGIEPSY'] = 0;
        for (let item of this.items) {
            if (!item.data.equiped && item.data.readCount) {
                if (item.data.readCount >= 7) {
                    for (let u = 0; u < item.template.unSkills.length; u++) {
                        let skill = item.template.unSkills[u];
                        canceledSkills[skill.id] = item;
                    }
                    for (let u = 0; u < item.template.skills.length; u++) {
                        this.computedData.skills.push({
                            skillDef: item.template.skills[u],
                            from: [item.data.name || item.template.name]
                        });
                    }
                }
            }
        }
        for (let item of this.computedData.itemsEquiped) {
            for (let u = 0; u < item.template.unSkills.length; u++) {
                let skill = item.template.unSkills[u];
                canceledSkills[skill.id] = item;
            }
            for (let u = 0; u < item.template.skills.length; u++) {
                this.computedData.skills.push({
                    skillDef: item.template.skills[u],
                    from: [item.data.name || item.template.name]
                });
            }
        }

        for (let job of this.jobs) {
            for (let skill of job.skills) {
                this.computedData.skills.push({
                    skillDef: skill,
                    from: [job.name]
                });
            }
        }
        for (let skill of this.origin.skills) {
            this.computedData.skills.push({
                skillDef: skill,
                from: [this.origin.name]
            });
        }
        for (let skill of this.skills) {
            this.computedData.skills.push({
                skillDef: skill,
                from: ['Choisi']
            });
        }
        this.computedData.skills.sort(function (a, b) {
            return a.skillDef.name.localeCompare(b.skillDef.name);
        });

        let flagsData: {[flagName: string]: FlagData[]} = {};

        this.jobs.forEach(j => j.getFlagsDatas(flagsData));
        this.origin.getFlagsDatas(flagsData);

        let prevSkill: SkillDetail|null = null;
        for (let i = 0; i < this.computedData.skills.length; i++) {
            let skill = this.computedData.skills[i];
            let ignoreSkill = false;
            if ('NO_SKILL' in flagsData) {
                let noSkills = flagsData['NO_SKILL'];
                for (let noSkill of noSkills) {
                    if (skill.skillDef.hasFlag(noSkill.data)) {
                        skill.canceled = 'Origine incompatible';
                        break;
                    }
                }
            }
            if (skill.skillDef.id in canceledSkills) {
                skill.canceled = 'Annulé par ' + canceledSkills[skill.skillDef.id].data.name;
            }
            if (prevSkill && skill.skillDef.id === prevSkill.skillDef.id) {
                prevSkill.from.push(skill.from[0]);
                this.computedData.skills.splice(i, 1);
                i--;
            } else {
                prevSkill = skill;
            }
        }

        for (let skill of this.computedData.skills) {
            if (skill.canceled) {
                continue;
            }
            skill.skillDef.getFlagsDatas(this.computedData.flags);
            if (skill.skillDef.effects && skill.skillDef.effects.length > 0) {
                let detailData = {};
                for (let j = 0; j < skill.skillDef.effects.length; j++) {
                    let modifier = skill.skillDef.effects[j];
                    this.computedData.stats[modifier.stat] += modifier.value;
                    detailData[modifier.stat] = modifier.value;
                }
                this.computedData.details.add(skill.skillDef.name, detailData);
            }
        }

        let equipedSortedItem = this.computedData.itemsEquiped.slice();
        // Sort items to avoid marking an item as "not usable" when character have requirement stats due to other items
        equipedSortedItem.sort((a, b) => {
            if (a.template.requirements && a.template.requirements.length
                && b.template.requirements && b.template.requirements.length) {
                return 0;
            }
            if (a.template.requirements && a.template.requirements.length) {
                return 1;
            }
            if (b.template.requirements && b.template.requirements.length) {
                return -1;
            }
            return 0;
        });

        for (let item of equipedSortedItem) {
            if (item.template.data.charge) {
                continue;
            }
            let modifications = {};

            item.computedData.incompatible = undefined;
            if (!item.data.ignoreRestrictions) {
                let incompatibilities = this.checkItemIncompatibilities(item);
                if (incompatibilities) {
                    item.computedData.incompatible = true;
                    continue;
                }
            }
            let somethingOver = false;
            for (let slot of item.template.slots) {
                for (let item2 of this.computedData.itemsBySlots[slot.id]) {
                    if (item2.id === item.id) {
                        continue;
                    }
                    if (item.data.equiped && item2.data.equiped) {
                        if (item.data.equiped < item2.data.equiped) {
                            somethingOver = true;
                            break;
                        }
                    }
                }
            }

            if (item.modifiers?.length) {
                item.computedData.modifierBonusDamage = undefined;
                for (let modifier of item.modifiers) {
                    if (!modifier.active) {
                        continue;
                    }
                    this.computedData.countActiveEffect++;
                    let detailData = {};
                    for (let k = 0; k < modifier.values.length; k++) {
                        let mod = modifier.values[k];
                        // Special case, PI modifiers on weapons should not be applied for the character.
                        // this is computed on weapons weapon damage
                        if (mod.stat === 'PI' && ItemTemplate.hasSlot(item.template, 'WEAPON')) {
                            item.computedData.modifierBonusDamage = (item.computedData.modifierBonusDamage || 0) + mod.value;
                            continue;
                        }
                        StatModifier.applyInPlace(this.computedData.stats, mod);
                        detailData[mod.stat] = formatModifierValue(mod);
                    }
                    this.computedData.details.add(item.data.name + '/' + modifier.name, detailData);
                }
            }

            let cleanModifiers = this.cleanItemModifiers(item);
            for (let m = 0; m < cleanModifiers.length; m++) {
                let modifier = cleanModifiers[m];
                if (modifier.jobId && !this.hasJob(modifier.jobId)) {
                    continue;
                }
                if (modifier.originId && modifier.originId !== this.origin.id) {
                    continue;
                }
                let affectStats = true;
                let overrideStatName = modifier.stat;
                if (modifier.special) {
                    if (modifier.special.indexOf('ONLY_IF_NOTHING_ON') >= 0) {
                        if (somethingOver) {
                            continue;
                        }
                    }
                    if (modifier.special.indexOf('AFFECT_ONLY_THROW') >= 0) {
                        overrideStatName = 'THROW_MODIFIER';
                    }
                    if (modifier.special.indexOf('DONT_AFFECT_MAGIEPSY') >= 0) {
                        this.computedData.stats[overrideStatName] += modifier.value;
                        this.computedData.stats['CHA_WITHOUT_MAGIEPSY'] += modifier.value;
                        modifications[overrideStatName] = modifier.value + '(!MPsy)';
                        affectStats = false;
                    }
                    if (modifier.special.indexOf('AFFECT_ONLY_MELEE') >= 0) {
                        // FIXME
                    }
                    if (modifier.special.indexOf('AFFECT_ONLY_MELEE_STAFF') >= 0) {
                        // FIXME
                    }
                    if (modifier.special.indexOf('AFFECT_PR_FOR_ELEMENTS') >= 0) {
                        // FIXME
                    }
                    if (modifier.special.indexOf('AFFECT_DISCRETION') >= 0) {
                        overrideStatName = 'DISCRETION_MODIFIER';
                    }
                    if (modifier.special.indexOf('AFFECT_ONLY_DANSE') >= 0) {
                        overrideStatName = 'DANSE_MODIFIER';
                    }
                }
                if (affectStats) {
                    StatModifier.applyInPlace(this.computedData.stats, {
                        stat: overrideStatName,
                        value: modifier.value,
                        type: modifier.type
                    });
                    if (modifications[overrideStatName] === null) {
                        modifications[overrideStatName] = 0;
                    }
                    modifications[overrideStatName] = formatModifierValue(modifier);
                }
            }
            if (item.template.data.protection) {
                modifications['PR'] = item.template.data.protection;
                this.computedData.stats['PR'] += item.template.data.protection;
            }
            if (item.template.data.magicProtection) {
                modifications['PR_MAGIC'] = item.template.data.magicProtection;
                this.computedData.stats['PR_MAGIC'] += item.template.data.magicProtection;
            }
            this.computedData.details.add(item.data.name || item.template.name, modifications);
        }

        if (this.computedData.stats['AD'] > 12 && this.statBonusAD) {
            this.computedData.stats[this.statBonusAD] += 1;
            let detailData = {};
            detailData[this.statBonusAD] = '+1';
            this.computedData.details.add('Bonus AD > 12', detailData);
        }
        if (this.computedData.stats['AD'] < 9 && this.statBonusAD) {
            this.computedData.stats[this.statBonusAD] -= 1;
            let detailData = {};
            detailData[this.statBonusAD] = -1;
            this.computedData.details.add('Malus AD < 9', detailData);
        }

        this.computedData.stats['MPHYS'] =
            Math.round(
                (this.computedData.stats['INT'] + this.computedData.stats['AD'])
                / 2
            );
        this.computedData.stats['MPSY'] =
            Math.round((
                    this.computedData.stats['INT'] +
                    (this.computedData.stats['CHA'] - this.computedData.stats['CHA_WITHOUT_MAGIEPSY'])
                )
                / 2
            );
        this.computedData.stats['RESM'] +=
            Math.round((this.computedData.stats['COU']
                + this.computedData.stats['INT']
                + this.computedData.stats['FO'])
                / 3
            );

        this.computedData.details.add('Base', {
            MPHYS: '<sup>(' + this.computedData.stats['INT']
            + ' + ' + this.computedData.stats['AD'] + ')</sup>&frasl;<sub>2</sub>',
            MPSY: '<sup>(' + this.computedData.stats['INT']
            + ' + ' + (this.computedData.stats['CHA']
            - this.computedData.stats['CHA_WITHOUT_MAGIEPSY'])
            + ')</sup>&frasl;<sub>2</sub>',
            RESM: '<sup>(' + this.computedData.stats['COU']
            + ' + ' + this.computedData.stats['INT'] + ' ' +
            '+ ' + this.computedData.stats['FO'] + ')</sup>&frasl;<sub>3</sub>',
        });

        if (this.computedData.stats['FO'] > 12) {
            this.computedData.stats['PI'] += (this.computedData.stats['FO'] - 12);
            this.computedData.details.add('Bonus FO > 12', {'PI': this.computedData.stats['FO'] - 12});
        }
        if (this.computedData.stats['FO'] < 9) {
            this.computedData.stats['PI'] -= 1;
            this.computedData.details.add('Malus FO < 9', {'PI': -1});
        }

        if (this.ev === undefined) {
            this.ev = this.computedData.stats['EV'];
        }
        if (this.ea  === undefined && this.computedData.stats['EA']) {
            this.ea = this.computedData.stats['EA'];
        }

        let statToZero = ['CHA', 'FO', 'COU', 'INT', 'AD', 'AT', 'PRD', 'MPHYS', 'MPSY', 'RESM'];
        for (let i = 0; i < statToZero.length; i++) {
            if (this.computedData.stats[statToZero[i]] < 0) {
                this.computedData.stats[statToZero[i]] = 0;
            }
        }

        this.computedData.countExceptionalStats = 0;
        if (this.computedData.stats['AD'] > 12) {
            this.computedData.countExceptionalStats++;
        }
        if (this.computedData.stats['AD'] < 9) {
            this.computedData.countExceptionalStats++;
        }
        if (this.computedData.stats['INT'] > 12) {
            this.computedData.countExceptionalStats++;
        }

        this.computeTacticalMovement();
    }

    private computeTacticalMovement() {
        let distance: number;
        let sprintDistance: number;
        let maxDuration: number;
        let sprintMaxDuration: number;
        let force: number = this.computedData.stats['FO'];
        switch (this.computedData.stats['PR']) {
            case 0:
            case 1:
                distance = 8;
                sprintDistance = 12;
                maxDuration = force * 20;
                sprintMaxDuration = force * 5;
                break;
            case 2:
                distance = 6;
                sprintDistance = 10;
                maxDuration = force * 18;
                sprintMaxDuration = force * 5;
                break;
            case 3:
            case 4:
                distance = 4;
                sprintDistance = 8;
                maxDuration = force * 15;
                sprintMaxDuration = force * 4;
                break;
            case 5:
                distance = 4;
                sprintDistance = 6;
                maxDuration = force * 10;
                sprintMaxDuration = force * 4;
                break;
            case 6:
                distance = 3;
                sprintDistance = 4;
                maxDuration = force * 8;
                sprintMaxDuration = force * 3;
                break;
            case 7:
                distance = 2;
                sprintDistance = 3;
                maxDuration = force * 7;
                sprintMaxDuration = force * 2;
                break;
            default:
                distance = 1;
                sprintDistance = 2;
                maxDuration = force * 2;
                sprintMaxDuration = force * 2;
                break;
        }
        let speedModifier = this.computedData.stats['MV'] / 100;
        this.computedData.tacticalMovement.distance = distance * speedModifier;
        this.computedData.tacticalMovement.sprintDistance = sprintDistance * speedModifier;
        this.computedData.tacticalMovement.maxDuration = maxDuration * speedModifier;
        this.computedData.tacticalMovement.sprintMaxDuration = sprintMaxDuration * speedModifier;
    }

    updateWeaponsDamages() {
        let weaponDamages: {name: string, damage: string, incompatible?: boolean}[] = [];
        for (let item of this.items) {
            if (!item.data.equiped) {
                continue;
            }
            if (ItemTemplate.hasSlot(item.template, 'WEAPON')) {
                let damage = item.getDamageString();
                let impactDamageItemBonus = item.computedData.modifierBonusDamage || 0;
                let impactDamageCharacterBonus = this.computedData.stats['PI'] || 0;
                let weaponBonusDamage = impactDamageItemBonus + impactDamageCharacterBonus;
                if (damage && weaponBonusDamage) {
                    if (weaponBonusDamage > 0) {
                        damage += ' (+' + weaponBonusDamage + ')';
                    }
                    else {
                        damage += ' (' + weaponBonusDamage + ')';
                    }
                }
                weaponDamages.push({
                    name: item.data.name || item.template.name,
                    damage: damage,
                    incompatible: item.computedData.incompatible
                });
            }
        }
        this.computedData.weaponsDamages = weaponDamages;
    }

    public update() {
        this.computedData.init();
        this.updateFlags();
        this.updateInventory();
        this.updateStats();
        this.updateWeaponsDamages();
        this.onUpdate.next(this);
    }

    onChangeCharacterStat(change: any) {
        if (this[change.stat] !== change.value) {
            this[change.stat] = change.value;
            this.update();
        }
    }

    onSetStatBonusAD(bonusStat: any) {
        if (this.statBonusAD !== bonusStat) {
            this.statBonusAD = bonusStat;
            this.update();
        }
    }

    onLevelUp(
        result: CharacterLevelUpResponse,
        skillsById: { [skillId: number]: Skill }
    ) {
        if (this.level !== result.newLevel) {
            this.level = result.newLevel;
            for (const modifier of ActiveStatsModifier.modifiersFromJson(result.newModifiers)) {
                this.modifiers.push(modifier);
            }
            for (const skillId of result.newSkillIds) {
                this.skills.push(skillsById[skillId]);
            }
            for (const speciality of result.newSpecialities) {
                this.specialities.push(Speciality.fromResponse(speciality));
            }
            this.update();
        }
    }

    onAddItem(item: Item) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === item.id) {
                return;
            }
        }

        this.items.push(item);
        this.update();
    }

    onEquipItem(it: PartialItem)  {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.id === it.id) {
                if (item.data.equiped === it.data.equiped) {
                    return;
                }
                item.data.equiped = it.data.equiped;
                this.update();
                return;
            }
        }
    }

    onDeleteItem(itemId: number) {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.id === itemId) {
                this.items.splice(i, 1);
                this.update();
                break;
            }
        }
    }

    onChangeContainer(item: PartialItem) {
        for (let i = 0; i < this.items.length; i++) {
            let it = this.items[i];
            if (it.id === item.id) {
                it.containerId = item.containerId;
                this.update();
                break;
            }
        }
    }

    onUpdateItem(partialItem: ItemPartialResponse) {
        let currentItem = this.items.find(i => i.id === partialItem.id);
        if (!currentItem) {
            throw new Error('Failed to find item ' + partialItem.id);
        }

        currentItem.data = partialItem.data;
        this.update();
    }

    onUpdateModifiers(item: PartialItem) {
        let it = this.items.find(i => i.id === item.id);
        if (it) {
            it.modifiers = ActiveStatsModifier.modifiersFromJson(item.modifiers);
            this.update();
        }
    }

    onAddModifier(modifier: ActiveStatsModifier) {
        for (let i = 0 ; i < this.modifiers.length; i++) {
            if (this.modifiers[i].id === modifier.id) {
                return;
            }
        }
        this.modifiers.push(modifier);
        this.update();
    }

    onRemoveModifier(modifierId: number) {
        for (let i = 0; i < this.modifiers.length; i++) {
            let e = this.modifiers[i];
            if (e. id === modifierId) {
                this.modifiers.splice(i, 1);
                this.update();
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
                this.modifiers[i] .active = modifier.active;
                this.modifiers[i].currentCombatCount = modifier.currentCombatCount;
                this.modifiers[i] .currentTimeDuration = modifier.currentTimeDuration;
                this.modifiers[i].currentLapCount = modifier.currentLapCount;
                break;
            }
        }
        this.update();
    }

    public onAddJob(job: Job): void {
        let jobIndex = this.jobs.findIndex(j => j.id === job.id);
        if (jobIndex === -1) {
            this.jobs.push(job);
            this.update();
        }
    }

    public onRemoveJob(job: Job | Guid): void {
        let jobId: Guid = job instanceof Job ? job.id : job;
        let jobIndex = this.jobs.findIndex(j => j.id === jobId);
        if (jobIndex !== -1) {
            this.jobs.splice(jobIndex, 1);
            this.update();
        }
    }

    public getWsTypeName(): string {
        return 'character';
    }

    public changeActive(isActive: number) {
        if (isActive === this.active) {
            return;
        }
        this.active = isActive;
    }

    handleWebsocketEvent(opcode: string, data: any, database: {skillsById: SkillDictionary, jobsById: JobDictionary}) {
        switch (opcode) {
            case 'update': {
                this.onChangeCharacterStat(data);
                break;
            }
            case 'statBonusAd': {
                this.onSetStatBonusAD(data);
                break;
            }
            case 'levelUp': {
                this.onLevelUp(data, database.skillsById);
                break;
            }
            case 'equipItem': {
                this.onEquipItem(data);
                break;
            }
            case 'addJob': {
                this.onAddJob(database.jobsById[data.jobId]);
                break;
            }
            case 'removeJob': {
                this.onRemoveJob(data.jobId);
                break;
            }
            case 'addItem': {
                this.onAddItem(Item.fromResponse(data, database.skillsById));
                break;
            }
            case 'deleteItem': {
                this.onDeleteItem(data);
                break;
            }
            case 'changeContainer': {
                this.onChangeContainer(data);
                break;
            }
            case 'updateItem': {
                this.onUpdateItem(data);
                break;
            }
            case 'updateItemModifiers': {
                this.onUpdateModifiers(data);
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
            case 'active': {
                this.changeActive(data);
                break;
            }
            case 'changeColor': {
                this.color = data;
                break;
            }
            case 'joinGroup': {
                this.group = data.group;
                this.invites = [];
                break;
            }
            case 'groupInvite': {
                this.invites.push(data);
                break;
            }
            case 'cancelInvite': {
                let i = this.invites.findIndex(d => d.groupId === data.groupId);
                if (i !== -1) {
                    this.invites.splice(i, 1);
                }
                break;
            }
            default:
                console.warn('Opcode not handle: `' + opcode + '`');
                break;
        }
    }

    dispose() {

    }
}
