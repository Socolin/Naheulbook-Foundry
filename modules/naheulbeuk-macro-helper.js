export class NaheulbeukMacroHelper {
    _defaultCriticsScoresDefinition = {
        1: 'epic-success',
        20: 'epic-fail'
    };

    _parryCriticsScoresDefinition = {
        1: 'epic-success',
        2: 'epic-success',
        20: 'epic-fail'
    }

    /**
     * @param {number} rollResult
     * @param {number}  targetScore
     * @param {Object.<number, 'epic-success'|'epic-fail'>} criticsScoresDefinition
     * @return {'success'|'fail'|'epic-success'|'epic-fail'}
     */
    getRollState(rollResult, targetScore, criticsScoresDefinition) {
        if (rollResult in criticsScoresDefinition)
            return criticsScoresDefinition[rollResult];

        if (rollResult <= targetScore) {
            return 'success';
        } else {
            return 'fail';
        }
    }

    /**
     * @param {string} skillName
     * @param {('success'|'fail'|'epic-success'|'epic-fail')} status
     * @return {string}
     */
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

    /**
     * @param {('success'|'fail'|'epic-success'|'epic-fail')} status
     * @return {boolean}
     */
    isSuccess(status) {
        return status === 'success' || status === 'epic-success';
    }

    /**
     * @param {string} skillName
     * @param {number} targetScore
     * @param {Object.<number, 'epic-success'|'epic-fail'>} criticsScoresDefinition
     * @return {Promise<"success"|"fail"|"epic-success"|"epic-fail">}
     */
    async rollSkillCheck(skillName, targetScore, criticsScoresDefinition = this._defaultCriticsScoresDefinition) {
        const roll = new Roll(`1d20`);
        roll.roll();

        let rollResult = roll.results[0];
        let resultState = this.getRollState(rollResult, targetScore, criticsScoresDefinition);
        let rollTestTextResult = this.formatTestResult(skillName, resultState);

        const messageData = roll.toMessage({}, {create: false});
        messageData.content = `<p>${skillName}: ${rollTestTextResult} (${rollResult} / ${targetScore})</p> ${await roll.render()}`;
        messageData.speaker = ChatMessage.getSpeaker({token: game.token});
        await ChatMessage.create(messageData);
        setTimeout(() => {
            this.playEpicSoundIfNeeded(resultState);
        }, 1000);

        return resultState;
    }

    /**
     * @param {string} dice
     * @return {Promise<Roll>}
     */
    async rollDamage(dice) {
        const roll = new Roll(dice);
        roll.roll();
        const messageData = roll.toMessage({}, {create: false});
        messageData.content = `<p>Dégâts: ${roll.results[0]}</p> ${await roll.render()}`
        await ChatMessage.create(messageData);
        return roll;
    }

    /**
     * @param {string} parryMessage
     * @param {number} targetScore
     * @return {Promise<"success"|"fail"|"epic-success"|"epic-fail">}
     */
    rollParry(parryMessage, targetScore) {
        return this.rollSkillCheck(parryMessage, targetScore, this._parryCriticsScoresDefinition);
    }

    /**
     * @param {string} attackName
     * @param {number} targetScore
     * @param {string} damageDice
     * @return {Promise<"success"|"fail"|"epic-success"|"epic-fail">}
     */
    async rollAttack(attackName, targetScore, damageDice) {
        const actionResult = await this.rollSkillCheck(attackName, targetScore);
        if (this.isSuccess(actionResult)) {
            await this.rollDamage(damageDice);
        }
        return actionResult;
    }

    /**
     * @param {('success'|'fail'|'epic-success'|'epic-fail')} resultState
     */
    playEpicSoundIfNeeded(resultState) {
        if (resultState === 'epic-success') {
            AudioHelper.play({src: 'systems/naheulbook/assets/sounds/critical-success.mp3', volume: 0.33, loop: false, autoplay: true}, true);
        }
        else if (resultState === 'epic-fail') {
            AudioHelper.play({src: 'systems/naheulbook/assets/sounds/epic-fail.mp3', volume: 0.33, loop: false, autoplay: true}, true);
        }
    }
}
