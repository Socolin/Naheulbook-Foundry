import {MacroData} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';

export class MacroUtil {

    static async createAndAssignMacroToFirstAvailableSlot(data: Partial<MacroData> & {name: string}): Promise<void> {
        let macro = await Macro.create(data)
        if (!macro) {
            throw new Error('Failed to create macro');
        }
        game.user?.assignHotbarMacro(macro, '');
    }

    static guardScriptExecutionWithTokenCheck(script: string): string {
        return `if (!token) {
  ui.notifications.warn("Sélectionner un token avant d'exécuter cette macro");
} else {
    ${script}
}`;
    }

    static async createNaheulbeukDefaultMacros() {
        let isNewUser = game.user?.getHotbarMacros(1).filter(x => x.macro != null).length === 0;

        if (isNewUser) {
            await MacroUtil.deleteSamplesMacro();
        }

        if (!MacroUtil.getSampleMacro('attack'))
            await MacroUtil.createAndAssignMacroToFirstAvailableSlot({
                name: 'Attaque',
                type: 'script',
                img: 'systems/naheulbook/assets/macro-icons/saber-slash.svg',
                command: MacroUtil.guardScriptExecutionWithTokenCheck(`token.actor.rollAttack();`),
                flags: {
                    "naheulbook.sampleMacro": 'attack'
                }
            });

        if (!MacroUtil.getSampleMacro('parry'))
            await MacroUtil.createAndAssignMacroToFirstAvailableSlot({
                name: 'Parade',
                type: 'script',
                img: 'systems/naheulbook/assets/macro-icons/shield.svg',
                command: MacroUtil.guardScriptExecutionWithTokenCheck(`token.actor.rollParry()`),
                flags: {
                    "naheulbook.sampleMacro": 'parry'
                }
            });

        return false;
    }

    static getSampleMacro(name) {
        let macro = game.macros?.contents.find(x => x.getFlag('naheulbook', 'sampleMacro') === name);
        if (macro && game.user && macro.testUserPermission(game.user, 'OWNER'))
            return macro;
        return undefined;
    }

    static async deleteSamplesMacro() {
        let macros = game.macros?.contents.filter(x => !!x.getFlag('naheulbook', 'sampleMacro'));
        if (!macros)
            return;

        for (let macro of macros) {
            if (game.user && macro.testUserPermission(game.user, 'OWNER'))
                macro.delete();
        }
    }

}
