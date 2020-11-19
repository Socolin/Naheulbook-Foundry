export class NaheulbookActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["naheulbook", "sheet", "actor"],
            template: "systems/naheulbook/templates/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
            scrollY: [".biography", ".items", ".attributes"],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

}
