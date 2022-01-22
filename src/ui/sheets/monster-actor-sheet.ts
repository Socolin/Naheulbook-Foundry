import {assertIsMonster} from '../../models/actor/monster-actor-properties';
import {container} from 'tsyringe';
import {MacroUtil} from '../../utils/macro-util';
import ClickEvent = JQuery.ClickEvent;
import {NaheulbookActor} from '../../models/actor/naheulbook-actor';

export interface MonsterActorSheetData extends ActorSheet.Data {
    isGm: boolean;
    isSynced: boolean;
    statsByGroup: typeof statsByGroup;
}

export class MonsterActorSheet<Options extends ActorSheet.Options = ActorSheet.Options>
    extends ActorSheet<Options, MonsterActorSheetData> {

    private readonly macroUtil: MacroUtil;
    private readonly game: Game;

    constructor(actor: NaheulbookActor, options: Partial<Options>) {
        super(actor, options);
        this.macroUtil = container.resolve(MacroUtil);
        this.game = container.resolve(Game)
    }

    override getData(options?: Partial<Options>): Promise<MonsterActorSheetData> | MonsterActorSheetData {
        assertIsMonster(this.actor);

        return {
            ...super.getData(options),
            statsByGroup: statsByGroup,
            isGm: !!this.game.user?.isGM,
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
                    await this.macroUtil.openMacroCreatorHelper(this.actor, stateName, stateDisplayName);
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
