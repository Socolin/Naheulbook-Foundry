import {inject, singleton} from 'tsyringe';
import {RollResult, RollUtil} from './roll-util';
import {Evaluated} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/roll';

export type AdditionalRoll = { label: string, item?: string, roll: Evaluated<Roll> };
export type TestRoll = { result: RollResult, total: number, successValue: number, roll: Evaluated<Roll> };

@singleton()
export class RollChatUtil {
    constructor(
        @inject(RollUtil) private readonly rollUtil: RollUtil
    ) {
    }

    async formatRollResult(
        label: string,
        icon: string,
        testRoll: TestRoll,
        additionalRoll?: AdditionalRoll
    ): Promise<string> {
        let message = '';

        message += `<div class="roll-result-chat">`;

        message += `<div class="header">`;
        message += `<div class="label">${label}</div>`;
        message += `<img class="icon" src="${icon}" alt="icon">`;
        message += `</div>`;

        message += `<div class="roll-result"><i class="fa fa-dice-d6"></i> ${testRoll.total} / ${testRoll.successValue} ${this.getTestResultMessage(testRoll.result)}</div>`;
        message += `<div class="roll">${await this.rollUtil.renderRollSmall(testRoll.roll)}</div>`;
        if (additionalRoll) {

            message += `<div class="additional-roll">`;
            message += `<div class="label">${additionalRoll.label}</div>`;
            if (additionalRoll.item)
                message += `<div class="item">${additionalRoll.item}</div>`;
            message += `<div class="roll">${await this.rollUtil.renderRollSmall(additionalRoll.roll)}</div>`;
            message += `</div>`;
        }

        message += `</div>`;

        return message;
    }

    getTestResultMessage(result: RollResult): string {
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
