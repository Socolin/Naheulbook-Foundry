import {NaheulbookConnector} from "./connector/naheulbook-connector.js";
import {NaheulbookConfig} from "./naheulbook-config.js";
import {NaheulbookActor} from './models/actor/naheulbook-actor';
import {MonsterActorSheet} from './ui/sheets/monster-actor-sheet';
import {CharacterActorSheet} from './ui/sheets/character-actor-sheet';
import {MacroUtil} from './utils/macro-util';
import {RollHelper} from './utils/roll-helper';

console.info('Naheulbook | Starting')

import './error-monitoring';

declare global {
    interface LenientGlobalVariableTypes {
        game: never; // the type doesn't matter
    }
}

// CONFIG.debug.hooks = true;

Hooks.once("init", async function () {
    CONFIG.Actor.documentClass = NaheulbookActor;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("naheulbook", CharacterActorSheet, {types: ['character'], makeDefault: true, label: 'Personnage'});
    Actors.registerSheet("naheulbook", MonsterActorSheet, {types: ['monster'], makeDefault: true, label: 'Monstre'});

    NaheulbookConfig.registerConfigs();
});


Hooks.once("ready", async function () {
    await MacroUtil.createNaheulbeukDefaultMacros();

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


Hooks.once('diceSoNiceReady', (dice3d) => {
    RollHelper.useDiceSoNice(dice3d);
});
