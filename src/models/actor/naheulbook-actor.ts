import {container} from "tsyringe";
import {CharacterActorData} from './character-actor-properties';
import {MonsterActorData, MonsterDamage} from './monster-actor-properties';
import {RollResult, RollUtil} from '../../utils/roll-util';
import {AdditionalRoll, RollChatUtil, TestRoll} from '../../utils/roll-chat-util';
import {DialogAwaiter} from '../../utils/dialog-awaiter';
import {SelectWeaponDialog} from '../../ui/dialog/select-weapon-dialog';
import {CharacterWeaponDamage} from '../../naheulbook-api/models/character.model';
import {RollFactory} from '../../utils/roll-factory';

export class NaheulbookActor extends Actor {
    private readonly rollUtil: RollUtil;
    private readonly rollChatUtil: RollChatUtil;
    private readonly dialogAwaiter: DialogAwaiter;
    private readonly rollFactory: RollFactory;

    constructor(...args: ConstructorParameters<typeof Actor>) {
        super(...args);
        this.rollUtil = container.resolve(RollUtil)
        this.rollChatUtil = container.resolve(RollChatUtil)
        this.dialogAwaiter = container.resolve(DialogAwaiter)
        this.rollFactory = container.resolve(RollFactory)
    }

    /**
     * The actor system data, typed for the actor types defined by this system
     */
    get stats(): CharacterActorData | MonsterActorData {
        return this.system as unknown as CharacterActorData | MonsterActorData;
    }

    async rollAttack(): Promise<RollResult | undefined> {
        let weapon: CharacterWeaponDamage | MonsterDamage | undefined;
        if (this.type === 'character') {
            let weapons = (this.stats as CharacterActorData).weapons;
            if (weapons.length === 1) {
                weapon = weapons[0];
            } else if (weapons.length > 1) {
                weapon = await this.dialogAwaiter.openAndWaitResult(SelectWeaponDialog, {weapons: weapons});
            }
        } else if (this.type === 'monster') {
            let damages = (this.stats as MonsterActorData).damages;
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

        let at = 'at' in weapon ? weapon.at : this.stats.at;
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
        if (!this.stats.prd && this.stats.esq) {
            return await this.rollAvoidance();
        }
        return await this.rollSkill('Parade', 'systems/naheulbook/assets/macro-icons/shield.svg', this.stats.prd)
    }

    async rollAvoidance(): Promise<RollResult> {
        return await this.rollSkill('Esquive', 'systems/naheulbook/assets/macro-icons/avoidance.svg', this.stats.esq)
    }

    async rollCustomSkill(
        name: string,
        icon: string | undefined,
        statName: string,
        testModifier: number,
        extra?: { rollFormula: string, item: string, label: string }
    ): Promise<RollResult> {
        icon = icon || 'systems/naheulbook/assets/macro-icons/dice20.svg';

        if (!(statName in this.stats))
            throw new Error(`Stat ${statName} is not available for actor data ${this.name} (${this.id}). Available are: ${Object.keys(this.stats).join(',')}`);

        let successValue = +this.stats[statName] + testModifier;

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
            rolls: [this.rollUtil.mergeRolls(rolls)],
        })

        await this.rollUtil.playEpicSoundAfterMessage(result, message?.id);

        return result;
    }

    async useMana(amount: number): Promise<void> {
        await this.update({
            system: {
                ea: {value: this.stats.ea.value - amount}
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
                ev: {value: Math.min(this.stats.ev.value + amount, this.stats.ev.max)}
            }
        }, {diff: true});
    }
}
