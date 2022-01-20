import {CharacterActorProperties} from './character-actor-properties';
import {MonsterActorProperties} from './monster-actor-properties';
import {RollHelper} from '../../utils/roll-helper';
import {RollMessageHelper} from '../../utils/roll-message-helper';
import {DialogAwaiter} from '../../utils/dialog-awaiter';
import {SelectWeaponDialog} from '../../ui/dialog/select-weapon-dialog';
import {CharacterWeaponDamage} from '../../naheulbook-api/models/character.model';

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
    constructor(data, context) {
        super(data, context);
    }

    async rollAttack(): Promise<void> {
        let weapon: CharacterWeaponDamage | undefined;
        if (this.data.type === 'character') {
            if (this.data.data.weapons.length === 1) {
                weapon = this.data.data.weapons[0];
            }
            else if (this.data.data.weapons.length > 1) {
                weapon = await DialogAwaiter.openAndWaitResult(SelectWeaponDialog, {weapons: this.data.data.weapons}) ;
            }
        }
        else if (this.data.type === 'monster') {

        }

        if (!weapon) {
            ui.notifications?.warn('Aucune arme disponible');
            return;
        }

        let roll = new Roll('1d20');
        await roll.roll({async: true});
        let result = RollHelper.getRollResult(roll.total!, this.data.data.at.value);

        let damageRoll = new Roll(weapon.rollFormula);
        await damageRoll.roll({async: true});

        await ChatMessage.create({
            content: await RollMessageHelper.formatRollResult(
                'Attaque',
                'systems/naheulbook/assets/macro-icons/saber-slash.svg',
                {roll: roll, successValue: this.data.data.at.value, total: roll.total!, result: result},
                {label:'Dégâts: ' + damageRoll.total! + (weapon.damageType ? `(${weapon.damageType})` : ''), item: weapon.name, roll: damageRoll}
            )
        })

        RollHelper.playEpicSoundIfNeeded(result, 100);
    }
}
