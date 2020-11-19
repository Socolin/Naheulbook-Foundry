import {NaheulbeukMacroHelper} from './naheulbeuk-macro-helper.js';
import {createNaheulbeukDefaultMacros} from "./macro.js";
import {NaheulbookActorSheet} from "./naheulbook-actor-sheet.js";
import {NaheulbookApi} from "./naheulbook-api.js";

Hooks.once("init", async function() {
    window['nhbkMacroHelper'] = new NaheulbeukMacroHelper();
    window['nhbkApi'] = new NaheulbookApi();

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("naheulbook", NaheulbookActorSheet, { makeDefault: true });

});

Hooks.once("ready", async function() {
    await createNaheulbeukDefaultMacros();
});

