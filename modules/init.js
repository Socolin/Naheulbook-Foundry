import {NaheulbeukMacroHelper} from './naheulbeuk-macro-helper.js';
import {createNaheulbeukDefaultMacros} from "./macro.js";
import {NaheulbookActorSheet} from "./naheulbook-actor-sheet.js";
import {NaheulbookConnector} from "./naheulbook-connector.js";

CONFIG.debug.hooks = true;
Hooks.once("init", async function() {
    window['nhbkMacroHelper'] = new NaheulbeukMacroHelper();

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("naheulbook", NaheulbookActorSheet, { makeDefault: true });
});

let naheulbookConnector = new NaheulbookConnector();

Hooks.once("ready", async function() {
    await createNaheulbeukDefaultMacros();
    await naheulbookConnector.connect()
});

