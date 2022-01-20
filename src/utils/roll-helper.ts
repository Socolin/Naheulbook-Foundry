export type RollResult = 'epicFail' | 'fail' | 'success' | 'criticalSuccess';

export class RollHelper {
    private static readonly defaultCriticsScoresDefinition = {
        1: 'criticalSuccess',
        20: 'epicFail'
    } as { [diceValue: number]: RollResult };

    private static readonly parryCriticsScoresDefinition = {
        1: 'criticalSuccess',
        2: 'criticalSuccess',
        20: 'epicFail'
    } as { [diceValue: number]: RollResult };

    static getRollResult(rollTotal: number, maxSuccessScore: number, criticalDefinition: 'default' | 'parry' = 'default'): RollResult {
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

    static playEpicSoundIfNeeded(result: RollResult, delayInMs: number = 1000) {
        setTimeout(async () => {
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
        }, delayInMs);
    }

    static async renderRollSmall(roll: Roll): Promise<string> {
        let result = await roll.render();
        let totalIndex = result.indexOf('<h4 class="dice-total">')
        let endTotalIndex = result.indexOf('</h4>', totalIndex)
        return result.substring(0, totalIndex) + result.substring(endTotalIndex);
    }
}
