export class NaheulbeukMacroHelper {
    getRollState(rollResult, targetScore) {
        if (rollResult === 20) {
            return 'epic-fail';
        } else if (rollResult === 1) {
            return 'epic-success';
        } else if (rollResult <= targetScore) {
            return 'success';
        } else {
            return 'fail';
        }
    }

    formatTestResult(skillName, status) {
        switch (status) {
            case 'success':
                return '<span style="color: darkgreen; font-weight: bold">Succès</span>';
            case 'fail':
                return '<span style="color: darkred; font-weight: bold">Échec</span>';
            case 'epic-fail':
                return '<span style="color: darkred; font-weight: bold">Échec critique</span>';
            case 'epic-success':
                return '<span style="color: darkgreen; font-weight: bold">Succès critique</span>';
        }
    }

    isSuccess(status) {
        return status === 'success' || status === 'epic-success';
    }

    async rollSkillCheck(skillName, targetScore) {
        const roll = new Roll(`1d20`);
        roll.roll();

        let rollResult = roll.results[0];
        let resultState = this.getRollState(rollResult, targetScore);
        let rollTestTextResult = this.formatTestResult(skillName, resultState);

        const messageData = roll.toMessage({}, {create: false});
        messageData.content = `<p>${skillName}: ${rollTestTextResult} (${rollResult} / ${targetScore})</p> ${await roll.render()}`
        await ChatMessage.create(messageData);
        setTimeout(() => {
            this.playEpicSoundIfNeeded(resultState);
        }, 1000);

        return resultState;
    }

    async rollDamage(dice) {
        const roll = new Roll(dice);
        roll.roll();
        const messageData = roll.toMessage({}, {create: false});
        messageData.content = `<p>Dégâts: ${roll.results[0]}</p> ${await roll.render()}`
        await ChatMessage.create(messageData);
    }

    async rollAttack(attackName, targetScore, damageDice) {
        const actionResult = await this.rollSkillCheck(attackName, targetScore);
        if (this.isSuccess(actionResult)) {
            await this.rollDamage(damageDice);
        }
    }

    async playEpicSoundIfNeeded(resultState) {
        if (resultState === 'epic-success') {
            AudioHelper.play({src: 'systems/naheulbook/assets/sounds/critical-success.mp3', volume: 0.33, loop: false, autoplay: true}, true);
        }
        else if (resultState === 'epic-fail') {
            AudioHelper.play({src: 'systems/naheulbook/assets/sounds/epic-fail.mp3', volume: 0.33, loop: false, autoplay: true}, true);
        }
    }
}
