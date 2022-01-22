import {singleton} from 'tsyringe';
import {Evaluated} from './roll-factory';

export type RollResult = 'epicFail' | 'fail' | 'success' | 'criticalSuccess';

@singleton()
export class RollUtil {
    private diceSoNiceReady = false;
    private pendingSounds: Record<string, RollResult> = {};

    private readonly defaultCriticsScoresDefinition = {
        1: 'criticalSuccess',
        20: 'epicFail'
    } as { [diceValue: number]: RollResult };

    private readonly parryCriticsScoresDefinition = {
        1: 'criticalSuccess',
        2: 'criticalSuccess',
        20: 'epicFail'
    } as { [diceValue: number]: RollResult };

    getRollResult(rollTotal: number, maxSuccessScore: number, criticalDefinition: 'default' | 'parry' = 'default'): RollResult {
        let criticalTableDefinition = this.defaultCriticsScoresDefinition;
        if (criticalDefinition == 'parry')
            criticalTableDefinition = this.parryCriticsScoresDefinition;

        if (rollTotal in criticalTableDefinition) {
            return criticalTableDefinition[rollTotal];
        }

        if (rollTotal <= maxSuccessScore)
            return 'success';

        return 'fail';
    }

    useDiceSoNice() {
        this.diceSoNiceReady = true;

        Hooks.on('diceSoNiceRollComplete', (messageId) => {
            if (messageId in this.pendingSounds) {
                this.playEpicSound(this.pendingSounds[messageId]).then();
                delete this.pendingSounds[messageId];
            }
        })
    }

    async playEpicSoundAfterMessage(result: RollResult, messageId?: string) {
        if (!this.diceSoNiceReady || !messageId) {
            await this.playEpicSound(result);
            return;
        } else {
            this.pendingSounds[messageId] = result;
        }
    }

    private async playEpicSound(result: RollResult) {
        if (result === 'criticalSuccess') {
            await AudioHelper.play({
                src: 'systems/naheulbook/assets/sounds/critical-success.mp3',
                volume: 0.20,
                loop: false,
                autoplay: true
            }, true);
        } else if (result === 'epicFail') {
            await AudioHelper.play({
                src: 'systems/naheulbook/assets/sounds/epic-fail.mp3',
                volume: 0.20,
                loop: false,
                autoplay: true
            }, true);
        }
    }

    async renderRollSmall(roll: Roll): Promise<string> {
        let result = await roll.render();
        let totalIndex = result.indexOf('<h4 class="dice-total">')
        let endTotalIndex = result.indexOf('</h4>', totalIndex)
        return result.substring(0, totalIndex) + result.substring(endTotalIndex);
    }

    mergeRolls(rolls: Evaluated<Roll>[]): Roll {
        let groupedRoll = new Roll('').toJSON();
        groupedRoll.terms = [PoolTerm.fromRolls(rolls)];
        groupedRoll.dice = []
        groupedRoll.evaluated = true;
        groupedRoll.total = 0;

        let formulas: string[] = [];
        for (let roll of rolls) {
            formulas.push(roll.formula);
            groupedRoll.total += roll.total;
        }
        groupedRoll.formula = `{${formulas.join(',')}}`;

        return Roll.fromJSON(JSON.stringify(groupedRoll));
    }
}
