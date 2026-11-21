import {inject, injectable} from 'tsyringe';
import {DialogBase, DialogResultCallback} from './dialog-base';
import {CharacterWeaponDamage} from '../../naheulbook-api/models/character.model';
import {MonsterDamage} from '../../models/actor/monster-actor-properties';

export interface SelectWeaponDialogData {
    weapons: CharacterWeaponDamage[] | MonsterDamage[]
}

@injectable()
export class SelectWeaponDialog extends DialogBase<SelectWeaponDialogData, CharacterWeaponDamage | MonsterDamage> {
    static override DEFAULT_OPTIONS: foundry.applications.api.ApplicationV2.DefaultOptions = {
        id: "select-weapon",
        window: {title: "Choisir une arme"},
        position: {width: 400},
        actions: {
            selectWeapon: SelectWeaponDialog.onSelectWeapon,
        },
    };

    static override PARTS = {
        content: {template: "systems/naheulbook/ui/dialog/select-weapon-dialog.hbs"},
    };

    private selectedWeaponId: number | undefined;

    constructor(
        @inject("DIALOG_DATA") data: SelectWeaponDialogData,
        @inject("DIALOG_RESULT") result: DialogResultCallback<CharacterWeaponDamage | MonsterDamage>,
    ) {
        super(data, result);
    }

    override async _prepareContext(options: Parameters<DialogBase<unknown, unknown>['_prepareContext']>[0]) {
        return {
            ...await super._prepareContext(options),
            weapons: this.dialogData.weapons,
            ready: !!this.selectedWeaponId,
            selectedWeaponId: this.selectedWeaponId
        };
    }

    private static async onSelectWeapon(this: SelectWeaponDialog, _event: PointerEvent, target: HTMLElement) {
        const weaponId = +(target.dataset.weaponId ?? 0);
        if (weaponId) {
            this.selectedWeaponId = weaponId;
            await this.render();
        }
    }

    override getResult(): CharacterWeaponDamage | MonsterDamage | undefined {
        return (this.dialogData.weapons as (CharacterWeaponDamage | MonsterDamage)[]).find(w => w.itemId == this.selectedWeaponId);
    }
}
