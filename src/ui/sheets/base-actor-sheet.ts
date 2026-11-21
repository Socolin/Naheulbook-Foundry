import {container} from 'tsyringe';
import {MacroUtil} from '../../utils/macro-util';
import {InitializedGame} from '../../models/misc/game';

const {HandlebarsApplicationMixin} = foundry.applications.api;
const {ActorSheetV2} = foundry.applications.sheets;

export interface StatDefinition {
    stat: string;
    name: string;
    canUseForSkill: boolean;
}

export type StatsByGroup = Record<string, { label: string, stats: StatDefinition[] }>;

export abstract class BaseActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    static override DEFAULT_OPTIONS: foundry.applications.sheets.ActorSheetV2.DefaultOptions = {
        classes: ['naheulbook', 'naheulbook-actor-sheet'],
        position: {width: 600, height: 600},
        window: {resizable: true},
        form: {submitOnChange: true},
        actions: {
            rollStat: BaseActorSheet.onRollStat,
            createStatMacro: BaseActorSheet.onCreateStatMacro,
        },
    };

    static override TABS = {
        primary: {
            tabs: [
                {id: 'attributes', label: 'Attributes'},
                {id: 'naheulbook', label: 'Naheulbook'},
            ],
            initial: 'attributes',
        },
    };

    protected readonly macroUtil = container.resolve(MacroUtil);
    protected readonly game = container.resolve(InitializedGame);

    protected abstract get statsByGroup(): StatsByGroup;

    protected abstract get isSynced(): boolean;

    override async _prepareContext(options: Parameters<foundry.applications.sheets.ActorSheetV2['_prepareContext']>[0]) {
        return {
            ...await super._prepareContext(options),
            actor: this.actor,
            system: this.actor.system,
            tabs: this._prepareTabs('primary'),
            statsByGroup: this.statsByGroup,
            isGm: this.game.user.isGM,
            isSynced: this.isSynced,
        };
    }

    private static getStatInfo(target: HTMLElement): { statName: string, statDisplayName: string } {
        const attributeContainer = target.closest<HTMLElement>('[data-stat-name]');
        if (!attributeContainer)
            throw new Error('Failed to find a parent with stat infos');
        return {
            statName: attributeContainer.dataset.statName!,
            statDisplayName: attributeContainer.dataset.statDisplayName!,
        };
    }

    private static async onRollStat(this: BaseActorSheet, _event: PointerEvent, target: HTMLElement) {
        const {statName, statDisplayName} = BaseActorSheet.getStatInfo(target);
        await this.actor.rollCustomSkill(statDisplayName, undefined, statName, 0);
    }

    private static async onCreateStatMacro(this: BaseActorSheet, _event: PointerEvent, target: HTMLElement) {
        const {statName, statDisplayName} = BaseActorSheet.getStatInfo(target);
        await this.macroUtil.openMacroCreatorHelper(this.actor, statName, statDisplayName);
    }
}
