import {inject, singleton} from 'tsyringe';
import {MacroData} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import {NaheulbookActor} from '../models/actor/naheulbook-actor';
import {DialogAwaiter} from './dialog-awaiter';
import {MacroCreatorHelperDialog} from '../ui/dialog/macro-creator-helper-dialog';

@singleton()
export class MacroUtil {
    constructor(
        @inject(DialogAwaiter) private readonly dialogAwaiter: DialogAwaiter,
        @inject(Game) private readonly game: Game
    ) {
    }

    async createAndAssignMacroToFirstAvailableSlot(data: Partial<MacroData> & {name: string}): Promise<void> {
        let macro = await Macro.create(data)
        if (!macro) {
            throw new Error('Failed to create macro');
        }
        this.game.user?.assignHotbarMacro(macro, '');
    }

    guardScriptExecutionWithTokenCheck(script: string): string {
        return `if (!token) {
  ui.notifications.warn("Sélectionner un token avant d'exécuter cette macro");
} else {
    ${script}
}`;
    }

    async createNaheulbeukDefaultMacros() {
        let isNewUser = this.game.user?.getHotbarMacros(1).filter(x => x.macro != null).length === 0;

        if (isNewUser) {
            await this.deleteSamplesMacro();
        }

        if (!this.getSampleMacro('attack'))
            await this.createAndAssignMacroToFirstAvailableSlot({
                name: 'Attaque',
                type: 'script',
                img: 'systems/naheulbook/assets/macro-icons/saber-slash.svg',
                command: this.guardScriptExecutionWithTokenCheck(`token.actor.rollAttack();`),
                flags: {
                    "naheulbook.sampleMacro": 'attack'
                }
            });

        if (!this.getSampleMacro('parry'))
            await this.createAndAssignMacroToFirstAvailableSlot({
                name: 'Parade',
                type: 'script',
                img: 'systems/naheulbook/assets/macro-icons/shield.svg',
                command: this.guardScriptExecutionWithTokenCheck(`token.actor.rollParry()`),
                flags: {
                    "naheulbook.sampleMacro": 'parry'
                }
            });

        return false;
    }

    getSampleMacro(name) {
        let macro = this.game.macros?.contents.find(x => x.getFlag('naheulbook', 'sampleMacro') === name);
        if (macro && this.game.user && macro.testUserPermission(this.game.user, 'OWNER'))
            return macro;
        return undefined;
    }

    async deleteSamplesMacro() {
        let macros = this.game.macros?.contents.filter(x => !!x.getFlag('naheulbook', 'sampleMacro'));
        if (!macros)
            return;

        for (let macro of macros) {
            if (this.game.user && macro.testUserPermission(this.game.user, 'OWNER'))
                macro.delete();
        }
    }

    async openMacroCreatorHelper(actor: NaheulbookActor, stat: string, label: string) {
        let macroInfo = await this.dialogAwaiter.openAndWaitResult(MacroCreatorHelperDialog, {
            actor: actor,
            stat: stat,
            label: label
        })
        if (!macroInfo)
            return;
        let command = this.guardScriptExecutionWithTokenCheck(`token.actor.rollCustomSkill(
                        '${macroInfo.name.replace(/'/g, '\\')}',
                        '${macroInfo.icon}',
                        '${macroInfo.stat}',
                        ${macroInfo.testModifier}
                        ${macroInfo.extraRoll ? `,${JSON.stringify(macroInfo.extraRoll)}` : ''},
                    );`);
        await this.createAndAssignMacroToFirstAvailableSlot({
            name: macroInfo.name,
            img: macroInfo.icon,
            type: 'script',
            command: command
        });
    }
}
