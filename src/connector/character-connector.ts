import {NaheulbookLogger} from '../utils/naheulbook-logger';
import {NaheulbookApi} from '../naheulbook-api/naheulbook-api';
import {TokenData} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import {
    TokenBarData
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/tokenBarData';
import {Character} from '../naheulbook-api/models/character.model';
import {CharacterActorData} from '../models/actor/character-actor-properties';
import {InitializedGame} from '../models/misc/game';

export class CharacterConnector {
    private _updatableStats = ['ev', 'ea'];
    private _updateActorHook: number;
    private _updateActorIdHook: number;

    constructor(
        private readonly nhbkApi: NaheulbookApi,
        private readonly logger: NaheulbookLogger,
        private readonly game: InitializedGame,
    ) {
    }

    enable(): void {
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
                    this.nhbkApi.changeCharacterStat(characterId, key, data.data[key].value).then();
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
                await this.stopSyncCharacter(oldCharacterId);
            }

            await actor.setFlag('naheulbook', 'characterId', newCharacterId);

            if (newCharacterId) {
                await this.syncCharacterActorWithNaheulbook(actor);
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

    async synchronizeGroupCharacters(groupId?: number): Promise<void> {
        if (!groupId) {
            return;
        }

        this.logger.info(`Synchronizing Naheulbook group characters: ${groupId}`);

        let playersFolder = await this.getOrCreatePlayersFolder();

        let group = await this.nhbkApi.loadGroupData(groupId);

        for (let characterId of group.characterIds) {
            let characterActor = this.game.actors.contents.find(actor => actor.getFlag('naheulbook', 'characterId') === characterId);
            if (characterActor) {
                continue;
            }

            let character = await this.nhbkApi.loadCharacterData(characterId);
            character.update();
            let actor = await this._createCharacterActor(character, playersFolder);
            await this.nhbkApi.synchronizeCharacter(character, async (character) => {
                await this._updateActor(actor, character);
            });
        }
    }

    async synchronizeExistingCharactersActors(): Promise<void> {
        for (let actor of this.game.actors.contents.filter(a => a.data.type === 'character')) {
            if (!actor.testUserPermission(this.game.user, "OWNER"))
                continue;
            await this.syncCharacterActorWithNaheulbook(actor);
        }
    }

    private async syncCharacterActorWithNaheulbook(actor) {
        const naheulbookCharacterId = actor.getFlag('naheulbook', 'characterId') || actor.data?.data['naheulbookCharacterId'];
        if (!naheulbookCharacterId) {
            return;
        }

        try {
            this.logger.info(`Synchronizing actor ${actor.name}(${actor.id}) with naheulbook character: ${naheulbookCharacterId}`);

            await actor.setFlag('naheulbook', 'characterId', naheulbookCharacterId);

            let character = await this.nhbkApi.loadCharacterData(naheulbookCharacterId);
            await this.nhbkApi.synchronizeCharacter(character, async (character) => this._updateActor(actor, character));
        } catch (e) {
            this.logger.warn(`Failed to sync character ${actor.name} with id ${naheulbookCharacterId}`, e)
        }
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
            data: foundry.utils.mergeObject(this._convertCharacterToActorData(character), {naheulbookCharacterId: character.id}),
            folder: folder.data._id,
            token: this.createTokenData(character),
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
        this.logger.info(`Received character data change from naheulbook: ${character.name} (${character.id})`);
        await actor.update(this._convertCharacterToActorData(character), {fromNaheulbook: true})
    }

    _convertCharacterToActorData(character: Character) {
        return {
            name: character.name,
            data: {
                naheulbookCharacterId: character.id,
                ev: {
                    value: character.ev,
                    max: character.computedData.stats['EV']
                },
                ea: {
                    value: character.ea,
                    max: character.computedData.stats['EA']
                },

                at: character.computedData.stats['AT'],
                prd: character.computedData.stats['PRD'],
                pr: character.computedData.stats['PR'],
                pr_magic: character.computedData.stats['PR_MAGIC'],
                esq: character.computedData.stats['ESQ'],

                resm: character.computedData.stats['RESM'],
                mpsy: character.computedData.stats['MPSY'],
                mphys: character.computedData.stats['MPHYS'],

                ad: character.computedData.stats['AD'],
                int: character.computedData.stats['INT'],
                cha: character.computedData.stats['CHA'],
                fo: character.computedData.stats['FO'],
                cou: character.computedData.stats['COU'],

                weapons: character.computedData.weaponsDamages
            } as CharacterActorData
        };
    }

    private async stopSyncCharacter(characterId: number): Promise<void> {
        await this.nhbkApi.stopSynchronizeCharacter(characterId);
    }

    private async getOrCreatePlayersFolder(): Promise<Folder> {
        let folder = ui.actors?.folders.find(f => f.getFlag('naheulbook', 'specialFolder') === 'players');

        if (!folder) {
            folder = await Folder.create({
                name: 'Joueurs',
                type: "Actor",
                parent: null,
                flags: {"naheulbook.specialFolder": "players"}
            });
            if (!folder) {
                throw new Error('Failed to create folder `Joueurs`');
            }
        }

        return folder;
    }

    private createTokenData(character: Character): TokenData {
        let tokenData = {
            actorLink: true,
            displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
            bar1: {attribute: 'ev'}
        } as TokenData;

        if (character.computedData.stats['EA']) {
            tokenData.bar2 = {
                attribute: 'ea'
            } as TokenBarData;
        }

        return tokenData;
    }
}
