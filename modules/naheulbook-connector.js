import {NaheulbookApi} from "./naheulbook-api.js";

export class NaheulbookConnector {
    updatableStats = ['ev', 'ea'];
    monstersById = {};
    isSynchronizing = false;
    naheulbookHost;

    init() {
        this.img = new Image();
        this.img.src = 'systems/naheulbook/assets/images/monster.svg';

        Hooks.on('renderPlayerList', (playerList, div, userData) => {
            if (game.user.role === USER_ROLES.GAMEMASTER) {
                return;
            }
            const gameMasterOnline = userData.users.find(u => u.role === USER_ROLES.GAMEMASTER && u.active)
            if (this.isSynchronizing && gameMasterOnline) {
                // Game master just connect, disconnect to avoid duplicate notification
                this.disconnect();
            } else if (!this.isSynchronizing && !gameMasterOnline) {
                // Game master disconnected, let's connect
                this.connect(this.naheulbookHost, this.groupId, this.accessKey);
            }
        });


        Hooks.on('updateActor', (actor, data, options, id) => {
            if (!this.isSynchronizing)
                return;
            if ('flags' in data)
                return;
            if (options.fromNaheulbook)
                return;
            let monsterId = actor.getFlag('naheulbook', 'monsterId');
            if (monsterId) {
                let keys = Object.keys(data.data);
                for (let key of keys) {
                    if ((typeof data.data) !== 'object')
                        continue;
                    if (!('value' in data.data[key]))
                        continue;
                    if (this.updatableStats.indexOf(key) === -1)
                        continue;
                    let monster = this.monstersById[monsterId];
                    this.nhbkApi.updateMonsterData(monsterId, {...monster.data, [key]: data.data[key].value});
                }
            }
            let characterId = actor.getFlag('naheulbook', 'characterId');
            if (characterId) {
                let keys = Object.keys(data.data);
                for (let key of keys) {
                    if ((typeof data.data) !== 'object')
                        continue;
                    if (!('value' in data.data[key]))
                        continue;
                    if (this.updatableStats.indexOf(key) === -1)
                        continue;
                    this.updateCharacterStat(characterId, key, data.data[key].value)
                }
            }
        })
    }

    async disconnect() {
        if (!this.isSynchronizing) {
            return;
        }

        if (this.nhbkApi.init()) {
            this.nhbkApi.disconnect();
            this.nhbkApi = undefined;
            this.isSynchronizing = false;
        }
    }

    async connect(naheulbookHost, groupId, accessKey) {
        this.naheulbookHost = naheulbookHost;
        this.groupId = groupId;
        this.accessKey = accessKey;
        if (this.isSynchronizing) {
            return;
        }
        if (game.user.role !== USER_ROLES.GAMEMASTER) {
            if (game.users.entities.find(u => u.role === USER_ROLES.GAMEMASTER && u.active)) {
                console.info('A GM is already connected, skip naheulbook sync');
                return;
            }
        }

        console.info('Connecting to Naheulbook');
        this.nhbkApi = NaheulbookApi.create(naheulbookHost, accessKey);
        await this.nhbkApi.init();
        this.isSynchronizing = true;
        console.info('Connected to Naheulbook, updating actors');
        await this.syncGroup(groupId);
        for (let actor of game.actors) {
            if (!actor.hasPerm(game.user, "OWNER"))
                continue;
            switch (actor.data.type) {
                case 'monster':
                    if ('naheulbookMonsterId' in actor.data.data) {
                        this.syncMonsterActorWithNaheulbook(actor);
                    }
                    break;
                case 'character':
                    if ('naheulbookCharacterId' in actor.data.data) {
                        this.syncCharacterActorWithNaheulbook(actor);
                    }
                    break;
            }
        }
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
        let monster = await this.nhbkApi.synchronizeMonster(naheulbookMonsterId, async (monster) => {
            console.info(`Received monster data change from naheulbook: ${monster.name} (${monster.id})`);
            await actor.update({
                name: monster.name,
                data: this.convertMonsterTokActorData(monster)
            }, {fromNaheulbook: true})
        });
        this.monstersById[monster.id] = monster;
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

    async syncGroup(groupId) {
        if (!groupId) {
            return;
        }

        let folder = ui.actors.folders.find(f => f.getFlag('naheulbook', 'specialFolder') === 'currentFight');
        if (!folder) {
            folder = await Folder.create({name: 'Combat courant', type: "Actor", parent: null, flags: {"naheulbook.specialFolder": "currentFight"}});
        }

        console.info(`Synchronizing group with naheulbook group: ${groupId}`);

        let monsters = await this.nhbkApi.loadGroupMonsters(groupId);
        for(let monster of monsters) {
            let monsterActor = game.actors.find((actor) => actor.getFlag('naheulbook', 'monsterId') === monster.id);
            if (monsterActor) {
                monsterActor.update({
                    img: this.createImage(monster.data.color, monster.data.number)
                }, {fromNaheulbook: true});
                continue;
            }
            this.createMonsterActorAndSyncIt(monster, folder);
        }

        await this.nhbkApi.listenToGroupEvent(groupId, {
            addMonster: (monster) => {
                this.createMonsterActorAndSyncIt(monster, folder);
            }
        });
    }

    createMonsterActorAndSyncIt(monster, folder) {
        Actor.create({
            name: monster.name,
            type: 'monster',
            img: this.createImage(monster.data.color, monster.data.number),
            data: mergeObject(this.convertMonsterTokActorData(monster), {naheulbookMonsterId: monster.id}),
            folder: folder.data._id,
            token: {
                actorLink: true,
                bar1: {attribute: 'ev'},
                bar2: {attribute: 'ea'},
            },
            items: [],
            flags: {"naheulbook.monsterId": monster.id}
        }).then((actor) => {
            this.syncMonsterActorWithNaheulbook(actor)
        });
    }

    createImage(color, number) {
        let canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        ui.sidebar.activateTab('actors');
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = color ? '#' + color : 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
        if (number) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = '100px serif';
            ctx.fillText(number, 50, 50);
            ctx.strokeText(number, 50, 50);
        }
        return canvas.toDataURL("image/png");
    }

    convertMonsterTokActorData(monster) {
        console.log({monster});
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
}
