import {container} from "tsyringe";
import {CharacterActorData, CharacterActorProperties} from './character-actor-properties';
import {MonsterActorData, MonsterActorProperties, MonsterDamage} from './monster-actor-properties';
import {RollResult, RollUtil} from '../../utils/roll-util';
import {AdditionalRoll, RollChatUtil, TestRoll} from '../../utils/roll-chat-util';
import {DialogAwaiter} from '../../utils/dialog-awaiter';
import {SelectWeaponDialog} from '../../ui/dialog/select-weapon-dialog';
import {CharacterWeaponDamage} from '../../naheulbook-api/models/character.model';
import {RollFactory} from '../../utils/roll-factory';

declare global {
    interface DataConfig {
        Actor: CharacterActorProperties | MonsterActorProperties;
    }
}

declare global {
    interface DocumentClassConfig {
        Actor: typeof NaheulbookActor;
    }
}

export class NaheulbookActor extends Actor {
    declare system: CharacterActorData | MonsterActorData;

    private readonly rollUtil: RollUtil;
    private readonly rollChatUtil: RollChatUtil;
    private readonly dialogAwaiter: DialogAwaiter;
    private readonly rollFactory: RollFactory;

    constructor(data, context) {
        super(data, context);
        this.rollUtil = container.resolve(RollUtil)
        this.rollChatUtil = container.resolve(RollChatUtil)
        this.dialogAwaiter = container.resolve(DialogAwaiter)
        this.rollFactory = container.resolve(RollFactory)
    }

    async rollAttack(): Promise<RollResult | undefined> {
        let weapon: CharacterWeaponDamage | MonsterDamage | undefined;
        if (this.type === 'character') {
            let weapons = (this.system as CharacterActorData).weapons;
            if (weapons.length === 1) {
                weapon = weapons[0];
            } else if (weapons.length > 1) {
                weapon = await this.dialogAwaiter.openAndWaitResult(SelectWeaponDialog, {weapons: weapons});
            }
        } else if (this.type === 'monster') {
            let damages = (this.system as MonsterActorData).damages;
            if (damages.length === 1) {
                weapon = damages[0];
            } else if (damages.length > 1) {
                weapon = await this.dialogAwaiter.openAndWaitResult(SelectWeaponDialog, {weapons: damages});
            }
        }

        if (!weapon) {
            ui.notifications?.warn('Aucune arme disponible');
            return undefined;
        }

        let at = 'at' in weapon ? weapon.at : this.system.at;
        let damageRoll = weapon.rollFormula ? await this.rollFactory.createRoll(weapon.rollFormula) : undefined;

        return await this.rollSkill(
            'Attaque',
            'systems/naheulbook/assets/macro-icons/saber-slash.svg',
            at,
            damageRoll ? {
                label: 'Dégâts: ' + damageRoll.total + (weapon.damageType ? `(${weapon.damageType})` : ''),
                item: weapon.name,
                roll: damageRoll
            } : undefined
        );
    }

    async rollParry(): Promise<RollResult> {
        if (!this.system.prd && this.system.esq) {
            return await this.rollAvoidance();
        }
        return await this.rollSkill('Parade', 'systems/naheulbook/assets/macro-icons/shield.svg', this.system.prd)
    }

    async rollAvoidance(): Promise<RollResult> {
        return await this.rollSkill('Esquive', 'systems/naheulbook/assets/macro-icons/avoidance.svg', this.system.esq)
    }

    async rollCustomSkill(
        name: string,
        icon: string | undefined,
        statName: string,
        testModifier: number,
        extra?: { rollFormula: string, item: string, label: string }
    ): Promise<RollResult> {
        icon = icon || 'systems/naheulbook/assets/macro-icons/dice20.svg';

        if (!(statName in this.system))
            throw new Error(`Stat ${statName} is not available for actor data ${this.name} (${this.id}). Available are: ${Object.keys(this.system).join(',')}`);

        let successValue = +this.system[statName] + testModifier;

        if (!extra) {
            return this.rollSkill(name, icon, successValue);
        }

        let damageRoll = await this.rollFactory.createRoll(extra.rollFormula);

        return await this.rollSkill(name, icon, successValue, {
            label: extra.label + damageRoll.total,
            item: extra.item,
            roll: damageRoll
        })
    }

    async rollSkill(
        name: string,
        icon: string,
        maxSuccessScore: number,
        additionalRoll?: AdditionalRoll
    ): Promise<RollResult> {
        let roll = await this.rollFactory.createRoll('1d20');
        let result = this.rollUtil.getRollResult(roll.total, maxSuccessScore);

        let rolls = [roll];
        if (additionalRoll)
            rolls.push(additionalRoll.roll);
        let message = await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: this}),
            content: await this.rollChatUtil.formatRollResult(
                name,
                icon,
                {roll: roll, successValue: maxSuccessScore, total: roll.total, result: result},
                additionalRoll
            ),
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls: [this.rollUtil.mergeRolls(rolls)],
        })

        await this.rollUtil.playEpicSoundAfterMessage(result, message?.id);

        return result;
    }

    async useMana(amount: number): Promise<void> {
        await this.update({
            system: {
                ea: {value: this.system.ea.value - amount}
            }
        }, {diff: true});
    }

    async useManaAfterCastingSpell(result: RollResult, mana: number) {
        let manaConsumeDiviser = result == 'fail' ? 2 : 1;
        await this.useMana(Math.max(1, Math.floor(mana / manaConsumeDiviser)));
    }

    async updateHealth(amount: number): Promise<void> {
        await this.update({
            system: {
                ev: {value: Math.min(this.system.ev.value + amount, this.system.ev.max)}
            }
        }, {diff: true});
    }
}
