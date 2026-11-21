import {inject, injectable} from 'tsyringe';
import {DialogBase, DialogResultCallback} from './dialog-base';
import {NaheulbookActor} from '../../models/actor/naheulbook-actor';

export interface MacroCreatorHelperDialogData {
    actor: NaheulbookActor;
    stat: string;
    label: string;
}

export interface MacroCreatorHelperDialogResult {
    name: string;
    stat: string;
    label: string;
    icon: string;
    testModifier: number;
    extraRoll?: { rollFormula: string, item: string, label: string };
}

@injectable()
export class MacroCreatorHelperDialog extends DialogBase<MacroCreatorHelperDialogData, MacroCreatorHelperDialogResult> {
    static override DEFAULT_OPTIONS: foundry.applications.api.ApplicationV2.DefaultOptions = {
        id: "macro-creator-helper",
        window: {title: "Création d'une macro"},
        position: {width: 450},
        actions: {
            selectImg: MacroCreatorHelperDialog.onSelectImg,
            enableExtraRoll: MacroCreatorHelperDialog.onEnableExtraRoll,
            test: MacroCreatorHelperDialog.onTest,
        },
    };

    static override PARTS = {
        content: {template: "systems/naheulbook/ui/dialog/macro-creator-helper-dialog.hbs"},
    };

    private readonly data: MacroCreatorHelperDialogResult;

    constructor(
        @inject("DIALOG_DATA") data: MacroCreatorHelperDialogData,
        @inject("DIALOG_RESULT") result: DialogResultCallback<MacroCreatorHelperDialogResult>,
    ) {
        super(data, result);
        this.data = {
            icon: 'systems/naheulbook/assets/macro-icons/dice20.svg',
            name: data.label,
            label: data.label,
            stat: data.stat,
            testModifier: 0
        };
    }

    private setValue<T>(data: object, name: string, value: T) {
        let splitName = name.split('.');
        for (let i = 0; i < splitName.length - 1; i++) {
            data = data[splitName[i]]
        }
        data[splitName[splitName.length - 1]] = value;
    }

    override async _prepareContext(options: Parameters<DialogBase<unknown, unknown>['_prepareContext']>[0]) {
        return {
            ...await super._prepareContext(options),
            data: this.data,
            ready: true
        };
    }

    protected override async _onFirstRender(...args: Parameters<DialogBase<unknown, unknown>['_onFirstRender']>) {
        await super._onFirstRender(...args);
        this.element.addEventListener('change', async (ev: Event) => {
            const input = ev.target as HTMLInputElement;
            if (!input.matches('[data-field-edit]'))
                return;
            const type = input.dataset.dtype || 'string';
            this.setValue(this.data, input.name, type === 'number' ? +input.value : input.value);
            await this.render();
        });
    }

    protected getResult(): MacroCreatorHelperDialogResult {
        return this.data;
    }

    private static async onSelectImg(this: MacroCreatorHelperDialog) {
        const fp = new foundry.applications.apps.FilePicker.implementation({
            type: "image",
            displayMode: 'thumbs',
            current: this.data.icon,
            callback: async (path: string) => {
                this.data.icon = path;
                await this.render();
            },
            position: {
                top: (this.position.top || 0) + 40,
                left: (this.position.left || 0) + 10
            }
        });
        await fp.browse('');
    }

    private static async onEnableExtraRoll(this: MacroCreatorHelperDialog) {
        if (this.data.extraRoll)
            this.data.extraRoll = undefined;
        else
            this.data.extraRoll = {
                item: '',
                label: 'Dégâts: ',
                rollFormula: '1d6'
            };
        await this.render();
    }

    private static async onTest(this: MacroCreatorHelperDialog) {
        await this.dialogData.actor.rollCustomSkill(
            this.data.name,
            this.data.icon,
            this.data.stat,
            this.data.testModifier,
            this.data.extraRoll
        );
    }
}
