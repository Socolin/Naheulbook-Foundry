import {inject, injectable} from 'tsyringe';
import {DialogBase, DialogResultCallback} from './dialog-base';
import {NaheulbookActor} from '../../models/actor/naheulbook-actor';
import ClickEvent = JQuery.ClickEvent;
import ChangeEvent = JQuery.ChangeEvent;

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

    setValue<T>(data: object, name: string, value: T) {
        let splitName = name.split('.');
        for (let i = 0; i < splitName.length - 1; i++) {
            data = data[splitName[i]]
        }
        data[splitName[splitName.length - 1]] = value;
        this.render(true);
    }

    override activateListeners(html: JQuery) {
        super.activateListeners(html);

        html.find('[data-field-edit]').on('change', async (ev: ChangeEvent) => {
            let type = ev.currentTarget.dataset.dtype || 'string';
            let value = (ev.currentTarget as HTMLInputElement).value;
            switch (type) {
                case 'number':
                    this.setValue(this.data, ev.currentTarget.name, +value);
                    break;
                default:
                    this.setValue(this.data, ev.currentTarget.name, value);
                    break;
            }
        });

        html.find('[data-action]').on('click', async (ev: ClickEvent) => {
            switch (ev.currentTarget.dataset.action) {
                case 'selectImg': {
                    let fp = new FilePicker({
                        type: "image",
                        displayMode: 'thumbs',
                        current: this.data.icon,
                        callback: path => {
                            ev.currentTarget.src = path;
                            this.data.icon = path;
                        },
                        top: (this.position.top || 0) + 40,
                        left: (this.position.left || 0) + 10
                    });
                    await fp.browse('');
                    break;
                }
                case 'enableExtraRoll': {
                    if (this.data.extraRoll)
                        this.data.extraRoll = undefined;
                    else
                        this.data.extraRoll = {
                            item: '',
                            label: 'Dégâts: ',
                            rollFormula: '1d6'
                        };
                    this.render(true);
                    break;
                }
                case 'test': {
                    await this.dialogData.actor.rollCustomSkill(
                        this.data.name,
                        this.data.icon,
                        this.data.stat,
                        this.data.testModifier,
                        this.data.extraRoll
                    );
                    break;
                }
            }
        });
    }

    getData(options?: Partial<Application.Options>): object | Promise<object> {
        return {
            ...super.getData(options),
            data: this.data,
            ready: true
        };
    }

    protected getResult(): MacroCreatorHelperDialogResult {
        return this.data;
    }


    static get defaultOptions(): Application.Options {
        return {
            ...super.defaultOptions,
            id: "macro-creator-helper",
            template: "systems/naheulbook/ui/dialog/macro-creator-helper-dialog.hbs",
            title: "Création d'une macro",
            width: 450,
            popOut: true,
        };
    }
}
