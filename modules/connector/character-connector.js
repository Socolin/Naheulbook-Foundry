export class CharacterConnector {
    _updatableStats = ['ev', 'ea'];

    /**
     * @type {NaheulbookApi}
     * @private
     */
    _nhbkApi;

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

    constructor(nhbkApi, logger) {
        this._nhbkApi = nhbkApi;
        this._logger = logger;
    }

    /**
     * @return void
     */
    enable() {
        // When an actor is updated (like when updating HP / Mana on a token linked to an actor) send this to naheulbook
        // to keep the actor sync with the monster. This allow to edit monster health/mana inside foundry.
        this._updateActorHook = Hooks.on('updateActor', (actor, data, options, _id) => {
            if (options.fromNaheulbook)
                return;
            if (!data.data)
                return;

            let characterId = actor.getFlag('naheulbook', 'characterId');
            if (characterId) {
                let keys = Object.keys(data.data);
                for (let key of keys) {
                    if ((typeof data.data) !== 'object')
                        continue;
                    if (this._updatableStats.indexOf(key) === -1)
                        continue;
                    if (!('value' in data.data[key]))
                        continue;
                    this._nhbkApi.changeCharacterStat(characterId, key, data.data[key].value).then();
                }
            }
        });
        this._updateActorIdHook = Hooks.on('updateActor', async (actor, data, options, _id) => {
            if (options.fromNaheulbook)
                return;
            if (!data.data)
                return;

            if (!('naheulbookCharacterId' in data.data))
                return;

            let oldCharacterId = actor.getFlag('naheulbook', 'characterId');
            let newCharacterId = +data.data.naheulbookCharacterId;
            if (oldCharacterId === newCharacterId)
                return;

            if (oldCharacterId) {
                await this._stopSyncCharacter(oldCharacterId);
            }

            await actor.setFlag('naheulbook', 'characterId', newCharacterId);

            if (newCharacterId) {
                await this._syncCharacterActorWithNaheulbook(actor);
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
    async synchronizeGroupCharacters(groupId) {
        if (!groupId) {
            return;
        }

        this._logger.info(`Synchronizing Naheulbook group characters: ${groupId}`);

        let playersFolder = await this._getOrCreatePlayersFolder();

        let group = await this._nhbkApi.loadGroupData(groupId);

        for (let characterId of group.characterIds) {
            let characterActor = game.actors.entities.find(actor => actor.getFlag('naheulbook', 'characterId') === characterId);
            if (characterActor) {
                continue;
            }

            let character = await this._nhbkApi.loadCharacterData(characterId);
            character.update();
            let actor = await this._createCharacterActor(character, playersFolder);
            await this._nhbkApi.synchronizeCharacter(character, async (character) => {
                this._updateActor(actor, character).then();
            });
        }
    }

    /**
     * @return void
     */
    synchronizeExistingCharactersActors() {
        for (let actor of game.actors.filter(a => a.data.type === 'character')) {
            if (!actor.hasPerm(game.user, "OWNER"))
                continue;
            if (actor instanceof Actor)
                this._syncCharacterActorWithNaheulbook(actor).then();
            break;
        }
    }


    async _syncCharacterActorWithNaheulbook(actor) {
        const naheulbookCharacterId = actor.getFlag('naheulbook', 'characterId') || actor.data?.data['naheulbookCharacterId'];
        if (!naheulbookCharacterId) {
            return;
        }

        console.info(`Synchronizing actor ${actor.name}(${actor.id}) with naheulbook character: ${naheulbookCharacterId}`);

        await actor.setFlag('naheulbook', 'characterId', naheulbookCharacterId);

        let character = await this._nhbkApi.loadCharacterData(naheulbookCharacterId);
        await this._nhbkApi.synchronizeCharacter(character, async (character) => this._updateActor(actor, character));
    }


    /**
     * @param {Character} character
     * @param {Folder} folder
     * @return {Promise<Actor>}
     * @private
     */
    _createCharacterActor(character, folder) {
        return Actor.create({
            name: character.name,
            type: 'character',
            data: mergeObject(this._convertCharacterToActorData(character), {naheulbookCharacterId: character.id}),
            folder: folder.data._id,
            token: this._createTokenData(character),
            items: [],
            flags: {"naheulbook.characterId": character.id}
        })
    }

    /**
     * @param {Actor} actor
     * @param {Character} character
     * @return {Promise<void>}
     * @private
     */
    async _updateActor(actor, character) {
        this._logger.info(`Received character data change from naheulbook: ${character.name} (${character.id})`);
        await actor.update(this._convertCharacterToActorData(character), {fromNaheulbook: true})
    }

    /**
     * @param {Character} character
     * @return {Object}
     * @private
     */
    _convertCharacterToActorData(character) {
        return {
            name: character.name,
            data: {
                at: {value: character.computedData.stats['AT']},
                prd: {value: character.computedData.stats['PRD']},

                ad: {value: character.computedData.stats['AD']},
                int: {value: character.computedData.stats['INT']},
                cha: {value: character.computedData.stats['CHA']},
                fo: {value: character.computedData.stats['FO']},
                cou: {value: character.computedData.stats['COU']},

                ev: {
                    value: character.ev,
                    max: character.computedData.stats['EV']
                },
                ea: {
                    value: character.ea,
                    max: character.computedData.stats['EA']
                },
                weaponDamages: character.computedData.weaponsDamages.reduce((previousValue, currentValue) => {
                    previousValue[currentValue.name] = currentValue.damage;
                    return previousValue;
                }, {})
            }
        };
    }

    /**
     * @param {number} characterId
     * @return {Promise<void>}
     * @private
     */
    async _stopSyncCharacter(characterId) {
        this._nhbkApi.stopSynchronizeCharacter(characterId).then();
    }


    /**
     * @return Folder
     * @private
     */
    async _getOrCreatePlayersFolder() {
        let folder = ui.actors.folders.find(f => f.getFlag('naheulbook', 'specialFolder') === 'players');
        if (!folder) {
            folder = await Folder.create({
                name: 'Joueurs',
                type: "Actor",
                parent: null,
                flags: {"naheulbook.specialFolder": "players"}
            });
        }

        return folder;
    }

    /**
     * @param {Character} character
     * @return {*}
     * @private
     */
    _createTokenData(character) {
        let tokenData = {
            actorLink: true,
            displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
            bar1: {attribute: 'ev'}
        };
        if (character.computedData.stats['EA']) {
            tokenData.bar2 = {
                attribute: 'ea'
            }
        }
        return tokenData;
    }
}
