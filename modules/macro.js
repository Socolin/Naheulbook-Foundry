export async function createNaheulbeukDefaultMacros() {
    let isNewUser = game.user?.getHotbarMacros(1).filter(x => x.macro !== null).length === 0;

    if (game.macros.entities.find(x => x.getFlag('naheulbook', 'sampleMacro') === 'attack') === undefined)
        await addMacroIfNewUser(isNewUser, await createSampleAttackMacro(), 1);

    if (game.macros.entities.find(x => x.getFlag('naheulbook', 'sampleMacro') === 'parry') === undefined)
        await addMacroIfNewUser(isNewUser, await createSampleParryMacro(), 2);

    return false;
}

async function createSampleAttackMacro() {
    const command = `if (!token) {
  ui.notifications.warn("Sélectionner un token avant d'exécuter cette macro");
} else {
  nhbkMacroHelper.rollAttack("Exemple d'attaque", token.actor.data.data.at.value, "1d6+5");
}`;

    return await Macro.create({
        name: 'Attaque (exemple)',
        type: 'script',
        img: 'systems/naheulbook/assets/macro-icons/saber-slash.svg',
        command: command,
        flags: {
            "naheulbook.sampleMacro": 'attack'
        }
    });
}

async function createSampleParryMacro() {
    const command = `if (!token) {
  ui.notifications.warn("Sélectionner un token avant d'exécuter cette macro");
} else {
  nhbkMacroHelper.rollAttack("Exemple de parade", token.actor.data.data.prd.value, "1d6+5");
}`;

    return await Macro.create({
        name: 'Parade (exemple)',
        type: 'script',
        img: 'systems/naheulbook/assets/macro-icons/shield.svg',
        command: command,
        flags: {
            "naheulbook.sampleMacro": 'parry'
        }
    });
}

async function addMacroIfNewUser(isNewUser, macro, slot) {
    if (!isNewUser)
        return;

    await game.user?.assignHotbarMacro(macro, slot);

}
