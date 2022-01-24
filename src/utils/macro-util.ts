import {inject, singleton} from 'tsyringe';
import {MacroData} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import {NaheulbookActor} from '../models/actor/naheulbook-actor';
import {DialogAwaiter} from './dialog-awaiter';
import {MacroCreatorHelperDialog} from '../ui/dialog/macro-creator-helper-dialog';
import {InitializedGame} from '../models/misc/game';
import {NaheulbookLogger} from './naheulbook-logger';

@singleton()
export class MacroUtil {
    constructor(
        @inject(DialogAwaiter) private readonly dialogAwaiter: DialogAwaiter,
        @inject(InitializedGame) private readonly game: InitializedGame,
        @inject(NaheulbookLogger) private readonly logger: NaheulbookLogger,
    ) {
    }

    async createAndAssignMacroToFirstAvailableSlot(data: Partial<MacroData> & {name: string}, slot?: number | string): Promise<void> {
        let macro = await Macro.create(data)
        if (!macro) {
            throw new Error('Failed to create macro');
        }
        if (slot && (slot in this.game.user.data.hotbar)) {
            slot = '';
        }
        try {
            await this.game.user.assignHotbarMacro(macro, slot || '');
        } catch (e) {
            console.error(`Failed to add macro add ${macro.name}: ${e.message}`);
        }
    }

    guardScriptExecutionWithTokenCheck(script: string): string {
        return `if (!token) {
  ui.notifications.warn("Sélectionner un token avant d'exécuter cette macro");
} else {
    ${script}
}`;
    }

    async createNaheulbeukDefaultMacros() {
        this.logger.info('Creating default macros');

        if (Object.keys(this.game.user.data.hotbar).length == 0) {
            this.logger.info('No macro assigned in hotbar yet, clean possible legacy macro');
            await this.deleteSamplesMacro();
        }

        // Cleanup old macro deleted but not removed
        for (let [slot, macroId] of Object.entries(this.game.user.data.hotbar)) {
            if (!this.game.macros.get(macroId)) {
                await this.game.user.assignHotbarMacro(null, slot);
            }
        }

        if (!this.getSampleMacro('attack')) {
            this.logger.info('Add default attack macro');
            await this.createAndAssignMacroToFirstAvailableSlot({
                name: 'Attaque',
                type: 'script',
                img: 'systems/naheulbook/assets/macro-icons/saber-slash.svg',
                command: this.guardScriptExecutionWithTokenCheck(`token.actor.rollAttack();`),
                flags: {
                    "naheulbook.sampleMacro": 'attack'
                }
            }, 1);
        }

        if (!this.getSampleMacro('parry')) {
            this.logger.info('Add default parry macro');
            await this.createAndAssignMacroToFirstAvailableSlot({
                name: 'Parade',
                type: 'script',
                img: 'systems/naheulbook/assets/macro-icons/shield.svg',
                command: this.guardScriptExecutionWithTokenCheck(`token.actor.rollParry()`),
                flags: {
                    "naheulbook.sampleMacro": 'parry'
                }
            }, 2);
        }

        return false;
    }

    getSampleMacro(name: string): Macro | undefined {
        let macro = this.game.macros.contents.find(x => x.getFlag('naheulbook', 'sampleMacro') === name);
        if (macro && this.game.user && macro.testUserPermission(this.game.user, 'OWNER'))
            return macro;
        return undefined;
    }

    async deleteSamplesMacro() {
        let macros = this.game.macros.contents.filter(x => !!x.getFlag('naheulbook', 'sampleMacro'));
        if (!macros)
            return;

        for (let macro of macros) {
            if (this.game.user && macro.testUserPermission(this.game.user, 'OWNER'))  {
                for (let [slot, macroId] of Object.entries(this.game.user.data.hotbar)) {
                    if (macroId == macro.id) {
                        delete this.game.user.data.hotbar[slot];
                    }
                }
                await macro.delete();
            }
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
