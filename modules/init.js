import {NaheulbeukMacroHelper} from './naheulbeuk-macro-helper.js';
import {createNaheulbeukDefaultMacros} from "./macro.js";
import {NaheulbookActorSheet} from "./naheulbook-actor-sheet.js";
import {NaheulbookConnector} from "./naheulbook-connector.js";
import {NaheulbookConfig} from "./naheulbook-config.js";


CONFIG.debug.hooks = true;

Hooks.once("init", async function () {
    window['nhbkMacroHelper'] = new NaheulbeukMacroHelper();

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("naheulbook", NaheulbookActorSheet, {makeDefault: true});

    game.settings.register("naheulbook", "naheulbookHost", {
        name: "Naheulbook url",
        hint: "L'adresse du site à utiliser. Par exemple: https://naheulbook.fr",
        scope: "world",
        config: true,
        type: String,
        default: "https://naheulbook.fr",
        onChange: value => NaheulbookConfig.instance.changeValue('naheulbookHost', value)
    });

    game.settings.register("naheulbook", "groupId", {
        name: "GroupId",
        hint: "Id du groupe sur naheulbook",
        scope: "world",
        config: true,
        type: Number,
        default: "",
        onChange: value => NaheulbookConfig.instance.changeValue('groupId', value)
    });

    game.settings.register("naheulbook", "accessKey", {
        name: "Access key",
        hint: "Clé d'accès naheulbook. Voir https://naheulbook.fr/profile",
        scope: "client",
        config: true,
        type: String,
        default: "",
        onChange: value => NaheulbookConfig.instance.changeValue('accessKey', value)
    });
});


Hooks.once("ready", async function () {
    await ui.sidebar.activateTab('actors');
    await createNaheulbeukDefaultMacros();
    let naheulbookConnector = new NaheulbookConnector(NaheulbookConfig.instance);
    naheulbookConnector.init();
    await naheulbookConnector.connect(
        game.settings.get("naheulbook", "naheulbookHost"),
        +game.settings.get("naheulbook", "groupId"),
        game.settings.get("naheulbook", "accessKey")
    )
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
