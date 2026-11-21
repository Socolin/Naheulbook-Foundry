import {assertIsCharacter} from '../../models/actor/character-actor-properties';
import {BaseActorSheet, StatsByGroup} from './base-actor-sheet';

export class CharacterActorSheet extends BaseActorSheet {
    static override DEFAULT_OPTIONS: foundry.applications.sheets.ActorSheetV2.DefaultOptions = {
        classes: ['naheulbook-character'],
    };

    static override PARTS = {
        sheet: {template: 'systems/naheulbook/ui/sheets/character-actor-sheet.hbs'},
    };

    protected override get statsByGroup(): StatsByGroup {
        return statsByGroup;
    }

    protected override get isSynced(): boolean {
        assertIsCharacter(this.actor);
        return !!this.actor.system.naheulbookCharacterId;
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
            {stat: 'int', name: 'Intéligence', canUseForSkill: true},
            {stat: 'cha', name: 'Charisme', canUseForSkill: true},
            {stat: 'ad', name: 'Adresse', canUseForSkill: true},
            {stat: 'fo', name: 'Force', canUseForSkill: true}
        ]
    },
    magic: {
        label: "Magie",
        stats: [
            {stat: 'resm', name: 'Résistance magique', canUseForSkill: true},
            {stat: 'mpsy', name: 'Magie Psy', canUseForSkill: true},
            {stat: 'mphys', name: 'Magie Phy', canUseForSkill: true}
        ]
    }
}
