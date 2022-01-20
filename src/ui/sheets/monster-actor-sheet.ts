export interface MonsterActorSheetData extends ActorSheet.Data {
    isGm: boolean;
}

export class MonsterActorSheet<Options extends ActorSheet.Options = ActorSheet.Options>
    extends ActorSheet<Options, MonsterActorSheetData> {

    /** @override */
    static get defaultOptions(): ActorSheet.Options {
        return {
            ...super.defaultOptions,
            template: "systems/naheulbook/ui/sheets/monster-actor-sheet.hbs",
            width: 600,
            height: 600,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        }
    }

    /* @override */
    getData(options?: Partial<Options>): Promise<MonsterActorSheetData> | MonsterActorSheetData {
        return {...super.getData(options), isGm: !!game.user?.isGM};
    }
}
