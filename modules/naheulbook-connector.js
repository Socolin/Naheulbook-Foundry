import {NaheulbookApi} from "./naheulbook-api.js";

export class NaheulbookConnector {
    updatableStats = ['ev', 'ea'];

    async connect(naheulbookHost) {
        // FIXME: If no GM is connected connect anyway for owned character.
        if (game.user.role !== USER_ROLES.GAMEMASTER) {
            console.info('Naheulbook connection skipped. Only available for GM');
            return;
        }

        console.info('Connecting to Naheulbook');
        this.nhbkApi = NaheulbookApi.create(naheulbookHost);
        await this.nhbkApi.init();
        console.info('Connected to Naheulbook, updating actors');
        for (let actor of game.actors) {
            switch (actor.data.type) {
                case 'monster':
                    if ('naheulbookMonsterId' in actor.data.data) {
                        await this.syncMonsterActorWithNaheulbook(actor);
                    }
                    break;
                case 'character':
                    if ('naheulbookCharacterId' in actor.data.data) {
                        await this.syncCharacterActorWithNaheulbook(actor);
                    }
                    break;
            }
        }
        Hooks.on('updateActor', (actor, data, options, id) => {
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


    async syncMonsterActorWithNaheulbook(actor) {
        let naheulbookMonsterId = actor?.data?.data['naheulbookMonsterId'];
        if (!naheulbookMonsterId) {
            return;
        }
        console.info(`Synchronizing actor ${actor.name}(${actor.id}) with naheulbook monster: ${naheulbookMonsterId}`);
        await actor.setFlag('naheulbook', 'monsterId', naheulbookMonsterId);
        await this.nhbkApi.synchronizeMonster(naheulbookMonsterId, async (monster) => {
            console.info(`Received monster data change from naheulbook: ${monster.name} (${monster.id})`);
            console.warn(monster, actor);
            await actor.update({
                name: monster.name,
                data: {
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
                }
            }, {fromNaheulbook: true})
        });
    }

    async syncCharacterActorWithNaheulbook(actor) {
        let naheulbookCharacterId = actor?.data?.data['naheulbookCharacterId'];
        if (!naheulbookCharacterId) {
            return;
        }
        console.info(`Synchronizing actor ${actor.name}(${actor.id}) with naheulbook character: ${naheulbookCharacterId}`);
        await actor.setFlag('naheulbook', 'characterId', naheulbookCharacterId);
        await this.nhbkApi.synchronizeCharacter(naheulbookCharacterId, async (character) => {
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
    }
}
