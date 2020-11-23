import {NaheulbeukMacroHelper} from './naheulbeuk-macro-helper.js';
import {createNaheulbeukDefaultMacros} from "./macro.js";
import {NaheulbookActorSheet} from "./naheulbook-actor-sheet.js";
import {NaheulbookConnector} from "./naheulbook-connector.js";

CONFIG.debug.hooks = true;
Hooks.once("init", async function() {
    window['nhbkMacroHelper'] = new NaheulbeukMacroHelper();

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("naheulbook", NaheulbookActorSheet, { makeDefault: true });

    game.settings.register("naheulbook", "naheulbookHost", {
        name: "Naheulbook url",
        hint: "L'adresse du site à utiliser. Par exemple: https://naheulbook.fr",
        scope: "world",
        config: true,
        type: String,
        default: "https://naheulbook.fr",
        onChange: value => console.log(value)
    });
});

let naheulbookConnector = new NaheulbookConnector();

Hooks.once("ready", async function() {
    await createNaheulbeukDefaultMacros();
    await naheulbookConnector.connect(game.settings.get("naheulbook", "naheulbookHost"))
});

Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
});

Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
});
