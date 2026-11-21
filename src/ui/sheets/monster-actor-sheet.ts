import {assertIsMonster} from '../../models/actor/monster-actor-properties';
import {BaseActorSheet, StatsByGroup} from './base-actor-sheet';

export class MonsterActorSheet extends BaseActorSheet {
    static override DEFAULT_OPTIONS: foundry.applications.sheets.ActorSheetV2.DefaultOptions = {
        classes: ['naheulbook-monster'],
    };

    static override PARTS = {
        sheet: {template: 'systems/naheulbook/ui/sheets/monster-actor-sheet.hbs'},
    };

    protected override get statsByGroup(): StatsByGroup {
        return statsByGroup;
    }

    protected override get isSynced(): boolean {
        assertIsMonster(this.actor);
        return !!this.actor.system.naheulbookMonsterId;
    }
}

const statsByGroup: StatsByGroup = {
    combat: {
        label: "Combat",
        stats: [
            {stat: 'at', name: 'Attaque', canUseForSkill: true},
            {stat: 'prd', name: 'Parade', canUseForSkill: true},
            {stat: 'pr', name: 'Protection', canUseForSkill: false},
            {stat: 'pr_magic', name: 'Protection magique', canUseForSkill: false}
        ]
    },
    bases: {
        label: "Statistiques",
        stats: [
            {stat: 'cou', name: 'Courage', canUseForSkill: true},
        ]
    },
    magic: {
        label: "Magie",
        stats: [
            {stat: 'resm', name: 'Résistance magique', canUseForSkill: true},
        ]
    }
}
