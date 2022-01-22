import {container} from "tsyringe";
import {CharacterActorProperties} from './character-actor-properties';
import {MonsterActorProperties, MonsterDamage} from './monster-actor-properties';
import {RollUtil} from '../../utils/roll-util';
import {AdditionalRoll, RollChatUtil} from '../../utils/roll-chat-util';
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

    async rollAttack(): Promise<void> {
        let weapon: CharacterWeaponDamage | MonsterDamage | undefined;
        if (this.data.type === 'character') {
            if (this.data.data.weapons.length === 1) {
                weapon = this.data.data.weapons[0];
            } else if (this.data.data.weapons.length > 1) {
                weapon = await this.dialogAwaiter.openAndWaitResult(SelectWeaponDialog, {weapons: this.data.data.weapons});
            }
        } else if (this.data.type === 'monster') {
            if (this.data.data.damages.length === 1) {
                weapon = this.data.data.damages[0];
            } else if (this.data.data.damages.length > 1) {
                weapon = await this.dialogAwaiter.openAndWaitResult(SelectWeaponDialog, {weapons: this.data.data.damages});
            }
        }

        if (!weapon) {
            ui.notifications?.warn('Aucune arme disponible');
            return;
        }

        let damageRoll = await this.rollFactory.createRoll(weapon.rollFormula);

        await this.rollSkill(
            'Attaque',
            'systems/naheulbook/assets/macro-icons/saber-slash.svg',
            this.data.data.at,
            {
                label: 'Dégâts: ' + damageRoll.total + (weapon.damageType ? `(${weapon.damageType})` : ''),
                item: weapon.name,
                roll: damageRoll
            }
        )
    }

    async rollParry() {
        await this.rollSkill('Parade', 'systems/naheulbook/assets/macro-icons/shield.svg', this.data.data.prd)
    }

    async rollCustomSkill(name: string, icon: string | undefined, statName: string, testModifier: number, extra?: { rollFormula: string, item: string, label: string }) {
        icon = icon || 'systems/naheulbook/assets/macro-icons/dice20.svg';

        if (!(statName in this.data.data))
            throw new Error(`Stat ${statName} is not available for actor data ${this.name} (${this.id}). Available are: ${Object.keys(this.data.data).join(',')}`);

        let successValue = +this.data.data[statName] + testModifier;

        if (!extra) {
            return this.rollSkill(name, icon, successValue);
        }

        let damageRoll = await this.rollFactory.createRoll(extra.rollFormula);

        await this.rollSkill(name, icon, successValue, {
            label: extra.label + damageRoll.total,
            item: extra.item,
            roll: damageRoll
        })
    }

    async rollSkill(name: string, icon: string, maxSuccessScore: number, additionalRoll?: AdditionalRoll) {
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
            roll: JSON.stringify(this.rollUtil.mergeRolls(rolls).toJSON()),
        })

        await this.rollUtil.playEpicSoundAfterMessage(result, message?.id);
    }
}
