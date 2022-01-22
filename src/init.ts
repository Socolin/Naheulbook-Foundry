import './error-monitoring';
import "reflect-metadata";
import {container} from "tsyringe";
import {NaheulbookConnector} from "./connector/naheulbook-connector.js";
import {NaheulbookConfig} from "./naheulbook-config.js";
import {NaheulbookActor} from './models/actor/naheulbook-actor';
import {MonsterActorSheet} from './ui/sheets/monster-actor-sheet';
import {CharacterActorSheet} from './ui/sheets/character-actor-sheet';
import {MacroUtil} from './utils/macro-util';
import {RollUtil} from './utils/roll-util';
import {InitializedGame} from './models/misc/game';

console.info('Naheulbook | Starting');

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
});

Hooks.once("ready", async function () {
    container.register<InitializedGame>(InitializedGame, {useValue: game as InitializedGame});

    let naheulbookConfig = container.resolve(NaheulbookConfig);
    naheulbookConfig.registerConfigs();

    let macroUtil = container.resolve(MacroUtil)
    await macroUtil.createNaheulbeukDefaultMacros();

    let naheulbookConnector = container.resolve(NaheulbookConnector)
    naheulbookConnector.init();
    await naheulbookConnector.connect();
});

Hooks.once('diceSoNiceReady', (_dice3d) => {
    let rollUtil = container.resolve(RollUtil)
    rollUtil.useDiceSoNice();
});
