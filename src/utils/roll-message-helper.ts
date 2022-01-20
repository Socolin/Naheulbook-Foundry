import {RollHelper, RollResult} from './roll-helper';

export class RollMessageHelper {
    static async formatRollResult(label: string,
                                  icon: string,
                                  testRoll: { result: RollResult, total: number, successValue: number, roll: Roll },
                                  additionalRoll?: { label: string, item?: string, roll: Roll }
    ): Promise<string> {
        let message = '';

        message += `<div class="roll-result-chat">`;

        message += `<div class="header">`;
        message += `<div class="label">${label}</div>`;
        message += `<img class="icon" src="${icon}" alt="icon">`;
        message += `</div>`;

        message += `<div class="roll-result"><i class="fa fa-dice-d6"></i> ${testRoll.total} / ${testRoll.successValue} ${RollMessageHelper.getTestResultMessage(testRoll.result)}</div>`;
        message += `<div class="roll">${await RollHelper.renderRollSmall(testRoll.roll)}</div>`;
        if (additionalRoll) {

            message += `<div class="additional-roll">`;
            message += `<div class="label">${additionalRoll.label}</div>`;
            if (additionalRoll.item)
                message += `<div class="item">${additionalRoll.item}</div>`;
            message += `<div class="roll">${await RollHelper.renderRollSmall(additionalRoll.roll)}</div>`;
            message += `</div>`;
        }

        message += `</div>`;

        return message;
    }

    static getTestResultMessage(result: RollResult): string {
        switch (result) {
            case 'criticalSuccess':
                return `<span style="color: green; font-weight: bold">Succès critique</span>`;
            case 'success':
                return `<span style="color: green; font-weight: bold">Succès</span>`;
            case 'fail':
                return `<span style="color: darkred; font-weight: bold">Échec</span>`;
            case 'epicFail':
                return `<span style="color: darkred; font-weight: bold">Échec critique</span>`;
        }
    }
}
