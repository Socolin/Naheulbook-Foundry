import {MonsterIconGenerator} from "./monster-icon-generator.js";
import {NaheulbookActor} from '../models/actor/naheulbook-actor';
import {MonsterActorData, MonsterDamage} from '../models/actor/monster-actor-properties';
import {Monster} from '../naheulbook-api/models/monster.model';
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
            if (!data.system)
                return;

            let monsterId = actor.getFlag('naheulbook', 'monsterId');
            if (monsterId) {
                let keys = Object.keys(data.system);
                for (let key of keys) {
                    if ((typeof data.system[key]) !== 'object')
                        continue;
                    if (this._updatableStats.indexOf(key) === -1)
                        continue;
                    if (!('value' in data.system[key]))
                        continue;
                    let monster = this._monstersById[monsterId];
                    await this.nhbkApi.updateMonsterData(monsterId, {...monster.data, [key]: data.system[key].value});
                }
            }
        });
        this._updateActorIdHook = Hooks.on('updateActor', async (actor, data, options, _id) => {
            if (options.fromNaheulbook)
                return;
            if (!data.system)
                return;

            if (!('naheulbookMonsterId' in data.system))
                return;

            let oldMonsterId = actor.getFlag('naheulbook', 'monsterId');
            let newMonsterId = +data.system.naheulbookMonsterId;
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
            let monsterActor = this.game.actors.find(actor => actor.getFlag('naheulbook', 'monsterId') === monster.id);
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
        for (let actor of this.game.actors.filter(a => a.type === 'monster')) {
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
        const naheulbookMonsterId = actor.getFlag('naheulbook', 'monsterId') || actor.system?.naheulbookMonsterId;
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
            system: this.convertMonsterTokActorData(monster),
            folder: folder.id,
            prototypeToken: this.createTokenData(monster),
            items: [],
            flags: {naheulbook: {monsterId: monster.id}}
        }).then((actor) => {
            this.syncMonsterActorWithNaheulbook(actor)
        });
    }

    /**
     * @return Folder
     * @private
     */
    async _getOrCreateCurrentFightFolder(): Promise<Folder> {
        let folder = this.game.folders.find(f => f.type === 'Actor' && f.getFlag('naheulbook', 'specialFolder') === 'currentFight');
        if (!folder) {
            folder = await Folder.create({
                name: 'Combat courant',
                type: "Actor",
                folder: null,
                flags: {naheulbook: {specialFolder: "currentFight"}}
            });
            if (!folder) {
                throw new Error('Failed to create folder `Combat courant`');
            }
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
            system: this.convertMonsterTokActorData(monster),
        } as { name: string, system: MonsterActorData, img?: string };

        if (actor.img?.indexOf('data:') === 0)
            data.img = await this._monsterIconGenerator.createMonsterIcon(monster);

        await actor.update(data, {fromNaheulbook: true})

        await this.replaceEffect(actor, 'naheulbookMonsterColor', 'Couleur', await this._monsterIconGenerator.createMonsterEffectIconColor(monster.data.color));
        await this.replaceEffect(actor, 'naheulbookMonsterNumber', 'Numéro', await this._monsterIconGenerator.createMonsterEffectIconNumber(monster.data.number));
    }

    private async replaceEffect(actor: NaheulbookActor, effectId: string, name: string, icon: string | undefined): Promise<void> {
        let colorEffect = actor.effects.find(e => e.statuses.has(effectId));
        if (colorEffect) {
            await colorEffect.delete();
        }

        if (!icon)
            return;
        const effectData = {
            name: name,
            img: icon,
            statuses: [effectId]
        };
        await ActiveEffect.create(effectData, {parent: actor})
    }

    async killMonster(monsterId: number): Promise<void> {
        let monsterActor = this.game.actors.find(actor => actor.getFlag('naheulbook', 'monsterId') === monsterId);
        if (!monsterActor)
            return;

        await monsterActor.toggleStatusEffect(CONFIG.specialStatusEffects.DEFEATED, {active: true, overlay: true});
    }

    private convertMonsterTokActorData(monster: Monster): MonsterActorData {

        return {
            naheulbookMonsterId: monster.id,
            at: monster.computedData.attacks[0]?.at ?? 0,
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
        for (let attack of monster.computedData.attacks) {
            let damage = attack.dmg?.trim();
            // Damages from equipped items are formatted like `1D+2(type)`
            let damageTypeMatch = damage?.match(/^(.*?)\s*\(\s*(.+?)\s*\)$/);
            let rollDamage = damageTypeMatch ? damageTypeMatch[1] : damage;
            damages.push({
                itemId: id++,
                name: attack.name || (monster.computedData.attacks.length > 1 ? `Attaque ${id - 1}` : 'Attaque'),
                at: attack.at,
                damage: damage || undefined,
                rollFormula: rollDamage ? this.parseMonsterDamage(rollDamage) : undefined,
                damageType: damageTypeMatch?.[2],
            })
        }
        return damages;
    }

    // Support `1D+2`, `2D-1`, `1D6+3`, `1D20`, `D`, `3` ...
    private readonly damageRegex = /^(?:(?<count>\d*)\s*[dD]\s*(?<faces>\d*))?\s*(?<modifier>[+-]?\s*\d+)?$/;
    private parseMonsterDamage(damage: string): string {
        let match = damage.match(this.damageRegex);
        if (match?.groups && (match[0].match(/[dD]/) || match.groups.modifier)) {
            let {count, faces, modifier} = match.groups;
            let formula = match[0].match(/[dD]/) ? `${count || 1}d${faces || 6}` : '';
            if (modifier) {
                modifier = modifier.replace(/\s+/g, '');
                formula += (formula && !modifier.startsWith('-') && !modifier.startsWith('+') ? '+' : '') + modifier;
            }
            return formula;
        }
        this.logger.warn('Unsupported monster damage form: ' + damage);
        return '1d6';
    }

    private createTokenData(monster: Monster): Actor.CreateData["prototypeToken"] {
        let tokenData = {
            actorLink: true,
            displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            bar1: {attribute: 'ev'}
        } as NonNullable<Actor.CreateData["prototypeToken"]>;
        if (monster.data.maxEa) {
            tokenData.bar2 = {
                attribute: 'ea'
            };
        }

        return tokenData;
    }
}
