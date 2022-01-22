import {assertIsMonster} from '../../models/actor/monster-actor-properties';
import {MacroUtil} from '../../utils/macro-util';
import ClickEvent = JQuery.ClickEvent;

export interface MonsterActorSheetData extends ActorSheet.Data {
    isGm: boolean;
    isSynced: boolean;
    statsByGroup: typeof statsByGroup;
}

export class MonsterActorSheet<Options extends ActorSheet.Options = ActorSheet.Options>
    extends ActorSheet<Options, MonsterActorSheetData> {

    override getData(options?: Partial<Options>): Promise<MonsterActorSheetData> | MonsterActorSheetData {
        assertIsMonster(this.actor);

        return {
            ...super.getData(options),
            statsByGroup: statsByGroup,
            isGm: !!game.user?.isGM,
            isSynced: !!this.actor.data.data.naheulbookMonsterId
        };
    }

    override activateListeners(html: JQuery) {
        super.activateListeners(html);

        html.find('[data-stat-action]').on('click', async (ev: ClickEvent) => {
            let attributeContainer = ev.currentTarget.closest('[data-stat-name]');
            if (!attributeContainer)
                throw new Error('Failed to find a parent with stat infos');
            let stateName = attributeContainer.dataset.statName;
            let stateDisplayName = attributeContainer.dataset.statDisplayName;
            switch (ev.currentTarget.dataset.statAction) {
                case 'test':
                    await this.actor.rollCustomSkill(stateDisplayName, undefined, stateName, 0);
                    break;
                case 'macro':
                    await MacroUtil.openMacroCreatorHelper(this.actor, stateName, stateDisplayName);
            }
        });
    }

    static override get defaultOptions(): ActorSheet.Options {
        return {
            ...super.defaultOptions,
            template: "systems/naheulbook/ui/sheets/monster-actor-sheet.hbs",
            width: 600,
            height: 600,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        }
    }
}

let statsByGroup = {
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
