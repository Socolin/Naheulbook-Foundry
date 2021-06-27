import {NaheulbeukMacroHelper} from './naheulbeuk-macro-helper.js';
import {createNaheulbeukDefaultMacros} from "./macro.js";
import {NaheulbookActorSheet} from "./naheulbook-actor-sheet.js";
import {NaheulbookConnector} from "./connector/naheulbook-connector.js";
import {NaheulbookConfig} from "./naheulbook-config.js";


// CONFIG.debug.hooks = true;

Hooks.once("init", async function () {
    window['nhbkMacroHelper'] = new NaheulbeukMacroHelper();

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("naheulbook", NaheulbookActorSheet, {makeDefault: true});

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
