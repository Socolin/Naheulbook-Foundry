export interface NaheulbookActorSheetData extends ActorSheet.Data {
    naheulbook: {
        isGm: boolean;
    }
}

export class NaheulbookActorSheet<Options extends ActorSheet.Options = ActorSheet.Options> extends ActorSheet<Options, NaheulbookActorSheetData> {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["naheulbook", "sheet", "actor"],
            template: "systems/naheulbook/templates/actor-sheet.hbs",
            width: 600,
            height: 600,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
            scrollY: [".biography", ".items", ".attributes"],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

    /* @override */
    getData(options?: Partial<Options>): Promise<NaheulbookActorSheetData> | NaheulbookActorSheetData {
        let naheulbookData = {naheulbook: {isGm: false}};
        if (game.user?.isGM) {
            naheulbookData.naheulbook.isGm = true;
        }
        return {...super.getData(options), ...naheulbookData};
    }
}
