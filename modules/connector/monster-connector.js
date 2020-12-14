import {MonsterIconGenerator} from "./monster-icon-generator.js";

export class MonsterConnector {
    _updatableStats = ['ev', 'ea'];
    /**
     * @type MonsterIconGenerator
     * @private
     */
    _monsterIconGenerator;

    /**
     * @type number
     * @private
     */
    _updateActorHook;

    /**
     * @type number
     * @private
     */
    _updateActorIdHook;

    /**
     * @type {Object.<string, Monster>}
     * @private
     */
    _monstersById = {};

    /**
     * @type {NaheulbookApi}
     * @private
     */
    _nhbkApi;

    /**
     * @type NaheulbookLogger
     * @private
     */
    _logger;

    constructor(nhbkApi, logger) {
        this._nhbkApi = nhbkApi;
        this._logger = logger;
        this._monsterIconGenerator = new MonsterIconGenerator();
    }

    /**
     * @return void
     */
    enable() {
        // When an actor is updated (like when updating HP / Mana on a token linked to an actor) send this to naheulbook
        // to keep the actor sync with the monster. This allow to edit monster health/mana inside foundry.
        this._updateActorHook = Hooks.on('updateActor', async (actor, data, options, id) => {
            if (options.fromNaheulbook)
                return;
            if (!data.data)
                return;

            let monsterId = actor.getFlag('naheulbook', 'monsterId');
            if (monsterId) {
                let keys = Object.keys(data.data);
                for (let key of keys) {
                    if ((typeof data.data) !== 'object')
                        continue;
                    if (this._updatableStats.indexOf(key) === -1)
                        continue;
                    if (!('value' in data.data[key]))
                        continue;
                    let monster = this._monstersById[monsterId];
                    await this._nhbkApi.updateMonsterData(monsterId, {...monster.data, [key]: data.data[key].value});
                }
            }
        });
        this._updateActorIdHook = Hooks.on('updateActor', async (actor, data, options, id) => {
            if (options.fromNaheulbook)
                return;
            if (!data.data)
                return;

            if (!('naheulbookMonsterId' in data.data))
                return;

            let oldMonsterId = actor.getFlag('naheulbook', 'monsterId');
            let newMonsterId = +data.data.naheulbookMonsterId;
            if (oldMonsterId === newMonsterId)
                return;

            if (oldMonsterId) {
                let monster = this._monstersById[oldMonsterId];
                delete this._monstersById[oldMonsterId];
                if (newMonsterId) {
                    this._monstersById[newMonsterId] = monster;
                }
                await actor.setFlag('naheulbook', 'monsterId', newMonsterId);
            } else if (newMonsterId) {
                await this.syncMonsterActorWithNaheulbook(actor);
            }
        });
    }

    /**
     * @return void
     */
    disable() {
        Hooks.off('updateActor', this._updateActorHook);
        Hooks.off('updateActor', this._updateActorIdHook);
    }

    /**
     * @param {number|undefined} groupId
     * @return Promise<void>
     */
    async synchronizeGroupMonsters(groupId) {
        if (!groupId) {
            return;
        }

        this._logger.info(`Synchronizing Naheulbook group: ${groupId}`);

        const currentFightFolder = await this._getOrCreateCurrentFightFolder()

        let monsters = await this._nhbkApi.loadGroupMonsters(groupId);
        for (let monster of monsters) {
            let monsterActor = game.actors.entities.find(actor => actor.getFlag('naheulbook', 'monsterId') === monster.id);
            if (monsterActor instanceof Actor) {
                this._updateActor(monsterActor, monster);
            } else {
                await this.createMonsterActorAndSyncIt(monster, currentFightFolder);
            }
        }

        await this._nhbkApi.listenToGroupEvent(groupId, {
            addMonster: (monster) => {
                this.createMonsterActorAndSyncIt(monster, currentFightFolder);
            },
            killMonster: (monsterId) => {
                this.killMonster(monsterId);
            }
        });
    }

    /**
     * @return void
     */
    synchronizeExistingMonstersActors() {
        for (let actor of game.actors.filter(a => a.data.type === 'monster')) {
            if (!actor.hasPerm(game.user, "OWNER"))
                continue;
            if (actor instanceof Actor)
                this.syncMonsterActorWithNaheulbook(actor);
        }
    }


    /**
     * @param {Actor} actor
     * @return {Promise<void>}
     */
    async syncMonsterActorWithNaheulbook(actor) {
        const naheulbookMonsterId = actor.getFlag('naheulbook', 'monsterId') || actor.data?.data['naheulbookCharacterId'];
        if (!naheulbookMonsterId) {
            return;
        }

        this._logger.info(`Synchronizing actor ${actor.name}(${actor.id}) with naheulbook monster: ${naheulbookMonsterId}`);

        let monster = await this._nhbkApi.synchronizeMonster(naheulbookMonsterId, (monster) => this._updateActor(actor, monster));
        this._monstersById[monster.id] = monster;
    }

    /**
     * @param {Monster} monster
     * @param {Folder} folder
     * @return {Promise<void>}
     */
    async createMonsterActorAndSyncIt(monster, folder) {
        Actor.create({
            name: monster.name,
            type: 'monster',
            img: await this._monsterIconGenerator.createMonsterIcon(monster),
            data: mergeObject(this._convertMonsterTokActorData(monster), {naheulbookMonsterId: monster.id}),
            folder: folder.data._id,
            token: this._createTokenData(monster),
            items: [],
            flags: {"naheulbook.monsterId": monster.id}
        }).then((actor) => {
            this.syncMonsterActorWithNaheulbook(actor)
        });
    }

    /**
     * @return Folder
     * @private
     */
    async _getOrCreateCurrentFightFolder() {
        let folder = ui.actors.folders.find(f => f.getFlag('naheulbook', 'specialFolder') === 'currentFight');
        if (!folder) {
            folder = await Folder.create({
                name: 'Combat courant',
                type: "Actor",
                parent: null,
                flags: {"naheulbook.specialFolder": "currentFight"}
            });
        }

        return folder;
    }

    /**
     * @param {Actor} actor
     * @param {Monster} monster
     * @return {Promise<void>}
     * @private
     */
    async _updateActor(actor, monster) {
        this._logger.info(`Updating actor ${actor.name} (${actor.id}) with monster data from naheulbook: ${monster.name} (${monster.id})`);
        let data = {
            name: monster.name,
            data: this._convertMonsterTokActorData(monster),
        };

        if (actor.data.img?.indexOf('data:') === 0)
            data.img = await this._monsterIconGenerator.createMonsterIcon(monster);

        await actor.update(data, {fromNaheulbook: true})

        await this._replaceEffect(actor, 'naheulbookMonsterColor', await this._monsterIconGenerator.createMonsterEffectIconColor(monster.data.color));
        await this._replaceEffect(actor, 'naheulbookMonsterNumber', await this._monsterIconGenerator.createMonsterEffectIconNumber(monster.data.number));
    }

    /**
     * @param {Actor} actor
     * @param {string} effectId
     * @param {string} icon
     * @return {Promise<void>}
     * @private
     */
    async _replaceEffect(actor, effectId, icon)
    {
        /** @type ActiveEffect */
        let colorEffect = actor.effects.find(e => e.getFlag('core', 'statusId') === effectId);
        if (colorEffect) {
            await colorEffect.delete({});
        }
        if (!icon)
            return;
        const effectData = {
            icon: icon,
            flags: {
                "core.statusId": effectId
            }
        };
        const effect = ActiveEffect.create(effectData, actor);
        await effect.create({});
    }

    /**
     * @param {number} monsterId
     * @return {Promise<void>}
     */
    async killMonster(monsterId) {
        let monsterActor = game.actors.entities.find(actor => actor.getFlag('naheulbook', 'monsterId') === monsterId);
        if (!monsterActor)
            return;

        let effectData = window.CONFIG.statusEffects.find(e => e.id === 'dead');
        const createData = duplicate(effectData);
        createData.label = game.i18n.localize(effectData.label);
        createData["flags.core.statusId"] = effectData.id;
        createData["flags.core.overlay"] = true;
        delete createData.id;

        const effect = ActiveEffect.create(createData, monsterActor);
        await effect.create({});
    }

    /**
     * @param {Monster} monster
     * @return {Object}
     * @private
     */
    _convertMonsterTokActorData(monster) {
        return {
            at: {value: monster.computedData.at},
            prd: {value: monster.computedData.prd},
            esq: {value: monster.computedData.esq},
            pr: {value: monster.computedData.pr},
            pr_magic: {value: monster.computedData.pr_magic},
            dmg: monster.computedData.dmg,
            cou: {value: monster.computedData.cou},
            chercheNoise: {value: monster.computedData.chercheNoise},
            resm: {value: monster.computedData.resm},
            ev: {
                value: monster.data.ev,
                max: monster.data.maxEv
            },
            ea: {
                value: monster.data.ea,
                max: monster.data.maxEa
            }
        };
    }

    /**
     * @param {Monster} monster
     * @return {*}
     * @private
     */
    _createTokenData(monster) {
        let tokenData = {
            actorLink: true,
            displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            bar1: {attribute: 'ev'}
        };
        if (monster.data.maxEa) {
            tokenData.bar2 = {
                attribute: 'ea'
            }
        }

        return tokenData;
    }
}
