import {MonsterIconGenerator} from "./monster-icon-generator.js";
import {MonsterIconStore} from "./monster-icon-store";
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
    _monsterIconGenerator: MonsterIconGenerator;
    private readonly monsterIconStore: MonsterIconStore;

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
        this.monsterIconStore = new MonsterIconStore(this._monsterIconGenerator, this.logger, this.game);
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
            let newMonsterId = Number(data.system.naheulbookMonsterId);
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
        const icon = await this.getMonsterIcon(monster);
        Actor.create({
            name: monster.name,
            type: 'monster',
            img: icon,
            system: this.convertMonsterTokActorData(monster),
            folder: folder.id,
            prototypeToken: {...this.createTokenData(monster), texture: {src: icon}},
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
        } as { name: string, system: MonsterActorData, img?: string, prototypeToken?: { texture: { src: string } } };

        let newIcon: string | undefined;
        if (this.monsterIconStore.isGeneratedIcon(actor.img)) {
            const icon = await this.getMonsterIcon(monster);
            if (icon !== actor.img) {
                newIcon = icon;
                data.img = icon;
                if (this.monsterIconStore.isGeneratedIcon(actor.prototypeToken?.texture?.src)) {
                    data.prototypeToken = {texture: {src: icon}};
                }
            }
        }

        await actor.update(data, {fromNaheulbook: true})

        if (newIcon) {
            await this.updatePlacedTokensIcon(actor, newIcon);
        }

        await this.removeLegacyIconEffects(actor);
    }

    private async getMonsterIcon(monster: Monster): Promise<string> {
        try {
            return await this.monsterIconStore.getMonsterIconPath(monster);
        } catch (e) {
            this.logger.warn(`Failed to store icon of monster ${monster.name}, using inline icon instead`, e);
            return await this._monsterIconGenerator.createMonsterIcon(monster);
        }
    }

    // Update the image of the tokens of this actor already placed on scenes, when they still use the generated icon
    private async updatePlacedTokensIcon(actor: NaheulbookActor, icon: string): Promise<void> {
        for (let scene of this.game.scenes) {
            const updates = scene.tokens
                .filter(token => token.actorId === actor.id && this.monsterIconStore.isGeneratedIcon(token.texture?.src))
                .map(token => ({_id: token.id, 'texture.src': icon}));
            if (updates.length === 0)
                continue;
            try {
                await scene.updateEmbeddedDocuments('Token', updates);
            } catch (e) {
                this.logger.warn(`Failed to update tokens icon of actor ${actor.name} on scene ${scene.name}`, e);
            }
        }
    }

    // Color and number used to be displayed with effects on the token, they are now part of the token image.
    private async removeLegacyIconEffects(actor: NaheulbookActor): Promise<void> {
        const effectIds = actor.effects
            .filter(e => e.statuses.has('naheulbookMonsterColor') || e.statuses.has('naheulbookMonsterNumber'))
            .map(e => e.id)
            .filter((id): id is string => !!id);
        if (effectIds.length > 0) {
            await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
        }
    }

    async killMonster(monsterId: number): Promise<void> {
        let monsterActor = this.game.actors.find(actor => actor.getFlag('naheulbook', 'monsterId') === monsterId);
        if (!monsterActor)
            return;

        this.logger.info(`Monster ${monsterActor.name} (${monsterId}) was killed in naheulbook, deleting its actor`);

        await this.markTokensAsDead(monsterActor);
        await this.markCombatantsAsDefeated(monsterActor);

        let monster = this._monstersById[monsterId];
        if (monster) {
            delete this._monstersById[monsterId];
            this.nhbkApi.stopSynchronizeMonster(monster);
        }

        await monsterActor.delete({fromNaheulbook: true} as never);
    }

    // Tokens cannot display status effects without an actor, so the skull of the "Dead" status is drawn in their image
    // to stay visible once the actor is deleted.
    private async markTokensAsDead(actor: Actor.Stored): Promise<void> {
        for (let scene of this.game.scenes) {
            const tokens = scene.tokens.filter(token => token.actorId === actor.id);
            if (tokens.length === 0)
                continue;

            const updates: Record<string, unknown>[] = [];
            for (let token of tokens) {
                const src = token.texture?.src;
                if (!src)
                    continue;
                try {
                    updates.push({_id: token.id, 'texture.src': await this.monsterIconStore.getDeadIconPath(src)});
                } catch (e) {
                    this.logger.warn(`Failed to generate dead icon of token ${token.name} from ${src}`, e);
                }
            }
            if (updates.length === 0)
                continue;

            try {
                await scene.updateEmbeddedDocuments('Token', updates);
            } catch (e) {
                this.logger.warn(`Failed to mark tokens of actor ${actor.name} as dead on scene ${scene.name}`, e);
            }
        }
    }

    // The combat tracker reads the defeated status from the actor, which is about to be deleted, so mark it explicitly
    private async markCombatantsAsDefeated(actor: Actor.Stored): Promise<void> {
        for (let combat of this.game.combats) {
            const updates = combat.combatants
                .filter(combatant => combatant.actorId === actor.id && !combatant.defeated)
                .map(combatant => ({_id: combatant.id, defeated: true}));
            if (updates.length === 0)
                continue;
            try {
                await combat.updateEmbeddedDocuments('Combatant', updates);
            } catch (e) {
                this.logger.warn(`Failed to mark combatants of actor ${actor.name} as defeated`, e);
            }
        }
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
