export class NaheulbookActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["naheulbook", "sheet", "actor"],
            template: "systems/naheulbook/templates/actor-sheet.handlebars",
            width: 600,
            height: 600,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
            scrollY: [".biography", ".items", ".attributes"],
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

    getData(options) {
        let naheulbookData = {naheulbook: {isGm: false}};
        if (game.user.role === USER_ROLES.GAMEMASTER) {
            naheulbookData.naheulbook.accessKey = this.getAccessKey();
            naheulbookData.naheulbook.isGm = true;
        }
            console.log({HERE: super.getData(options)})
        return mergeObject(super.getData(options), naheulbookData);
    }

    _getSubmitData(updateData = {}) {
        let data = super._getSubmitData(updateData);
        if ('naheulbook.accessKey' in data) {
            this.saveAccessKey(data['naheulbook.accessKey']);
            delete data['naheulbook.accessKey'];
        }
        return data;
    }

    saveAccessKey(key) {
        if (key !== undefined)
            localStorage.setItem('naheulbookAccessKey', key);
    }

    getAccessKey() {
        return localStorage.getItem("naheulbookAccessKey");
    }

}
