import {NaheulbookApi} from "./naheulbook-api.js";

export class NaheulbookConnector {
    actorsIdByNaheulbookId = {};
    updatableStats = ['ev', 'ea'];

    async connect(naheulbookHost) {
        if (game.user.role !== USER_ROLES.GAMEMASTER) {
            console.info('Naheulbook connection skipped. Only available for GM');
            return;
        }
        console.info('Connecting to Naheulbook');
        this.nhbkApi = NaheulbookApi.create(naheulbookHost);
        await this.nhbkApi.init();
        console.info('Connected to Naheulbook, updating actors');
        for (let actor of game.actors) {
            if ('naheulbookCharacterId' in actor.data.data) {
                await this.syncActorWithNaheulbook(actor);
            }
        }
        Hooks.on('updateActor', (actor, data, options, id) => {
            console.log('options');
            if ('flags' in data)
                return;
            if (options.fromNaheulbook)
                return;
            let characterId = actor.getFlag('naheulbook', 'characterId');
            if (!characterId)
                return;

            let keys = Object.keys(data.data);
            for (let key of keys) {
                if (!('value' in data.data[key]))
                    continue;
                if (this.updatableStats.indexOf(key) === -1)
                    continue;
                this.updateCharacterStat(characterId, key, data.data[key].value)
            }
        })
    }

    async updateCharacterStat(characterId, statName, value) {
        await this.nhbkApi.changeCharacterStat(characterId, statName, value);
    }

    getNaheulbookId(actor) {
        return actor?.data?.data['naheulbookCharacterId'];
    }

    async syncActorWithNaheulbook(actor) {
        let naheulbookCharacterId = this.getNaheulbookId(actor);
        if (!naheulbookCharacterId) {
            return;
        }
        console.info(`Synchronizing actor ${actor.name}(${actor.id}) with naheulbook character: ${naheulbookCharacterId}`);
        await actor.setFlag('naheulbook', 'characterId', naheulbookCharacterId);
        const character = await this.nhbkApi.synchronizeCharacter(naheulbookCharacterId, async (character) => {
            console.info(`Received character data change from naheulbook: ${character.name} (${character.id})`);
            await actor.update({
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
                    }
                }
            }, {fromNaheulbook: true})
        });

        this.actorsIdByNaheulbookId[character.id] = actor.id;
    }
}
