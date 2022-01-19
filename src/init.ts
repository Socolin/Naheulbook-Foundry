import {NaheulbeukMacroHelper} from './naheulbeuk-macro-helper.js';
import {createNaheulbeukDefaultMacros} from "./macro.js";
import {NaheulbookActorSheet} from "./naheulbook-actor-sheet.js";
import {NaheulbookConnector} from "./connector/naheulbook-connector.js";
import {NaheulbookConfig} from "./naheulbook-config.js";
import {NaheulbookActor} from './models/actor/naheulbook-actor';

console.warn('Naheulbook | Starting')

declare global {
    interface LenientGlobalVariableTypes {
        game: never; // the type doesn't matter
    }
}

// CONFIG.debug.hooks = true;

Hooks.once("init", async function () {
    CONFIG.Actor.documentClass = NaheulbookActor;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("naheulbook", NaheulbookActorSheet, {makeDefault: true});

    (window as any).nhbkMacroHelper = new NaheulbeukMacroHelper();

    NaheulbookConfig.registerConfigs();
});


Hooks.once("ready", async function () {
    await createNaheulbeukDefaultMacros();

    let naheulbookConnector = new NaheulbookConnector(NaheulbookConfig.instance);
    naheulbookConnector.init();
    await naheulbookConnector.connect();
});

Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) {
        return options.fn(this);
    }
    return options.inverse(this);
});
