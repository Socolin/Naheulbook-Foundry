export async function createNaheulbeukDefaultMacros() {
    let isNewUser = game.user?.getHotbarMacros(1).filter(x => x.macro != null).length === 0;

    if (isNewUser)
        await deleteSamplesMacro();


    await addMacroIfNewUser(isNewUser, await getOrCreateMacro('naheulbook', 'sampleMacro', 'attack', () => createSampleAttackMacro()), 1);
    await addMacroIfNewUser(isNewUser, await getOrCreateMacro('naheulbook', 'sampleMacro', 'parry', () => createSampleParryMacro()), 2);


    return false;
}

async function deleteSamplesMacro() {
    let macros = game.macros?.contents.filter(x => !!x.getFlag('naheulbook', 'sampleMacro'));
    if (!macros)
        return;

    for (let macro of macros) {
        if (game.user && macro.testUserPermission(game.user, 'OWNER'))
            macro.delete();
    }
}

async function getOrCreateMacro(flagDomain, flagKey, flagValue, createCb) {
    let macro = game.macros?.contents.find(x => x.getFlag('naheulbook', 'sampleMacro') === flagValue);
    if (macro && game.user && macro.testUserPermission(game.user, 'OWNER'))
        return macro;
    return await createCb();
}

async function createSampleAttackMacro() {
    const command = `if (!token) {
  ui.notifications.warn("Sélectionner un token avant d'exécuter cette macro");
} else {
  token.actor.rollAttack();
}`;

    return await Macro.create({
        name: 'Attaque',
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
  token.actor.rollParry();
}`;

    return await Macro.create({
        name: 'Parade',
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
