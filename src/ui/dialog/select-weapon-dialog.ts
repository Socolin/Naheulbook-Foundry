import {DialogBase} from './dialog-base';
import {CharacterWeaponDamage} from '../../naheulbook-api/models/character.model';
import ChangeEvent = JQuery.ChangeEvent;
import {MonsterDamage} from '../../models/actor/monster-actor-properties';

export interface SelectWeaponDialogData {
    weapons: CharacterWeaponDamage[] | MonsterDamage[]
}

export class SelectWeaponDialog extends DialogBase<SelectWeaponDialogData, CharacterWeaponDamage | MonsterDamage> {
    private selectedWeaponId: number | undefined;

    override getData(options?: Partial<Application.Options>): object | Promise<object> {
        return {
            ...super.getData(options),
            weapons: this.dialogData.weapons,
            ready: !!this.selectedWeaponId,
            selectedWeaponId: this.selectedWeaponId
        };
    }

    override activateListeners(html: JQuery) {
        super.activateListeners(html);
        html.on('change', (ev: ChangeEvent) => {
            let weaponId = +ev.target.dataset.weaponId;
            if (weaponId) {
                this.selectedWeaponId = weaponId;
                this.render(true);
            }
        })
    }

    override getResult(): CharacterWeaponDamage | undefined {
        return this.dialogData.weapons.find(w => w.itemId == this.selectedWeaponId);
    }

    static get defaultOptions(): Application.Options {
        return {
            ...super.defaultOptions,
            id: "select-weapon",
            template: "systems/naheulbook/ui/dialog/select-weapon-dialog.hbs",
            title: "Choisir une arme",
            width: 400,
            popOut: true,
        };
    }
}