import {MonsterIconGenerator} from "./monster-icon-generator.js";
import {NaheulbookActor} from '../models/actor/naheulbook-actor';
import {MonsterActorData, MonsterDamage} from '../models/actor/monster-actor-properties';
import {Monster} from '../naheulbook-api/models/monster.model';
import {ActorData, TokenData} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import {
    TokenBarData
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/tokenBarData';
import {NaheulbookApi} from '../naheulbook-api/naheulbook-api';
import {NaheulbookLogger} from '../utils/naheulbook-logger';
import {InitializedGame} from '../models/misc/game';

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


    constructor(
        private readonly nhbkApi: NaheulbookApi,
        private readonly logger: NaheulbookLogger,
        private readonly game: InitializedGame,
    ) {
        this._monsterIconGenerator = new MonsterIconGenerator();
    }

    /**
     * @return void
     */
    enable() {
        // When an actor is updated (like when updating HP / Mana on a token linked to an actor) send this to naheulbook
        // to keep the actor sync with the monster. This allow to edit monster health/mana inside foundry.
        this._updateActorHook = Hooks.on('updateActor', async (actor, data, options, _id) => {
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
                    await this.nhbkApi.updateMonsterData(monsterId, {...monster.data, [key]: data.data[key].value});
                }
            }
        });
        this._updateActorIdHook = Hooks.on('updateActor', async (actor, data, options, _id) => {
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

        this.logger.info(`Synchronizing Naheulbook group: ${groupId}`);

        const currentFightFolder = await this._getOrCreateCurrentFightFolder()

        let monsters = await this.nhbkApi.loadGroupMonsters(groupId);
        for (let monster of monsters) {
            let monsterActor = this.game.actors.contents.find(actor => actor.getFlag('naheulbook', 'monsterId') === monster.id);
            if (monsterActor instanceof Actor) {
                await this._updateActor(monsterActor, monster);
            } else {
                await this.createMonsterActorAndSyncIt(monster, currentFightFolder);
            }
        }

        await this.nhbkApi.listenToGroupEvent(groupId, {
            addMonster: (monster) => {
                this.createMonsterActorAndSyncIt(monster, currentFightFolder);
            },
            killMonster: (monsterId) => {
                this.killMonster(monsterId);
            }
        });
    }

    async synchronizeExistingMonstersActors(): Promise<void> {
        for (let actor of this.game.actors.filter(a => a.data.type === 'monster')) {
            if (!actor.testUserPermission(this.game.user, "OWNER"))
                continue;
            await this.syncMonsterActorWithNaheulbook(actor);
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

        try {
            this.logger.info(`Synchronizing actor ${actor.name}(${actor.id}) with naheulbook monster: ${naheulbookMonsterId}`);

            let monster = await this.nhbkApi.synchronizeMonster(naheulbookMonsterId, (monster) => this._updateActor(actor, monster));
            this._monstersById[monster.id] = monster;
        }
        catch (e) {
            this.logger.warn(`Failed to sync monster ${actor.name} with id ${naheulbookMonsterId}`, e)
        }
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
            data: foundry.utils.mergeObject(this.convertMonsterTokActorData(monster), {naheulbookMonsterId: monster.id}),
            folder: folder.data._id,
            token: this.createTokenData(monster),
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
        let folder = ui.actors?.folders.find(f => f.getFlag('naheulbook', 'specialFolder') === 'currentFight');
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
        this.logger.info(`Updating actor ${actor.name} (${actor.id}) with monster data from naheulbook: ${monster.name} (${monster.id})`);
        let data = {
            name: monster.name,
            data: this.convertMonsterTokActorData(monster),
        } as ActorData;

        if (actor.data.img?.indexOf('data:') === 0)
            data.img = await this._monsterIconGenerator.createMonsterIcon(monster);

        await actor.update(data, {fromNaheulbook: true})

        await this.replaceEffect(actor, 'naheulbookMonsterColor', await this._monsterIconGenerator.createMonsterEffectIconColor(monster.data.color));
        await this.replaceEffect(actor, 'naheulbookMonsterNumber', await this._monsterIconGenerator.createMonsterEffectIconNumber(monster.data.number));
    }

    private async replaceEffect(actor: NaheulbookActor, effectId: string, icon: string): Promise<void> {
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
        await ActiveEffect.create(effectData, {parent: actor})
    }

    async killMonster(monsterId: number): Promise<void> {
        let monsterActor = game.actors?.contents.find(actor => actor.getFlag('naheulbook', 'monsterId') === monsterId);
        if (!monsterActor)
            return;

        let effectData = CONFIG.statusEffects.find(e => e.id === 'dead');
        if (!effectData)
            return;

        const createData = duplicate(effectData);
        createData.label = game.i18n.localize(effectData.label);
        createData["flags.core.statusId"] = effectData.id;
        createData["flags.core.overlay"] = true;

        await ActiveEffect.create(effectData, {parent: monsterActor})
    }

    private convertMonsterTokActorData(monster: Monster): MonsterActorData {

        return {
            naheulbookMonsterId: monster.id,
            at: monster.computedData.at,
            prd: monster.computedData.prd,
            esq: monster.computedData.esq,
            pr: monster.computedData.pr,
            pr_magic: monster.computedData.pr_magic,
            damages: this.parseDamages(monster),
            cou: monster.computedData.cou,
            chercheNoise: monster.computedData.chercheNoise,
            mphys: 0,
            mpsy: 0,
            resm: monster.computedData.resm,
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

    private parseDamages(monster: Monster): MonsterDamage[] {
        let damages: MonsterDamage[] = []
        let id = 1;
        for (let dmgElement of monster.computedData.dmg) {
            for (let damage of dmgElement.damage.split(';')) {
                let [rollFormula, name] = this.parseMonsterDamage(damage);
                damages.push({
                    itemId: id++,
                    name: name || dmgElement.name,
                    damage: damage,
                    rollFormula: rollFormula
                })
            }
        }
        return damages;
    }

    private readonly rollWithNameRegex = /^(?<rollFormula>\d+\s*D\s*(?:\+\s*\d+))\s*\(\s*(?<name>[\w\s]+)\s*\)$/;
    private parseMonsterDamage(damage: string): [rollFormula: string, name?: string] {
        if (damage.match(/^\d+\s*[dD]\s*(\+\s*\d+)$/))
            return [damage.replace('d', 'd6').replace('D', 'd6')];
        if (damage.match(/^\d+\s*d6\s*(\+\s*\d+)$/))
            return [damage];
        let matchRollWithName = damage.match(this.rollWithNameRegex)
        if (matchRollWithName) {
            let rollFormula = matchRollWithName[1].replace('D', 'd6');
            let name = matchRollWithName[2].trim()
            return [rollFormula, name];
        }
        this.logger.warn('Unsupported monster damage form: ' + damage);
        return ['1d6'];
    }

    private createTokenData(monster: Monster): TokenData {
        let tokenData = {
            actorLink: true,
            displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            bar1: {attribute: 'ev'}
        } as TokenData;
        if (monster.data.maxEa) {
            tokenData.bar2 = {
                attribute: 'ea'
            } as TokenBarData
        }

        return tokenData;
    }
}
