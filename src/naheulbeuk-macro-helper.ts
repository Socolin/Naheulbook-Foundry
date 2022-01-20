export class NaheulbeukMacroHelper {
    _defaultCriticsScoresDefinition = {
        1: 'criticalSuccess',
        20: 'epicFail'
    };

    _parryCriticsScoresDefinition = {
        1: 'criticalSuccess',
        2: 'criticalSuccess',
        20: 'epicFail'
    }

    /**
     * @param {number} rollResult
     * @param {number}  targetScore
     * @param {Object.<number, 'criticalSuccess'|'epicFail'>} criticsScoresDefinition
     * @return {'success'|'fail'|'criticalSuccess'|'epicFail'}
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
     * @param {('success'|'fail'|'criticalSuccess'|'epicFail')} status
     * @return {string}
     */
    formatTestResult(skillName, status) {
        switch (status) {
            case 'success':
                return '<span style="color: darkgreen; font-weight: bold">Succès</span>';
            case 'fail':
                return '<span style="color: darkred; font-weight: bold">Échec</span>';
            case 'epicFail':
                return '<span style="color: darkred; font-weight: bold">Échec critique</span>';
            case 'criticalSuccess':
                return '<span style="color: darkgreen; font-weight: bold">Succès critique</span>';
        }
    }

    /**
     * @param {('success'|'fail'|'criticalSuccess'|'epicFail')} status
     * @return {boolean}
     */
    isSuccess(status) {
        return status === 'success' || status === 'criticalSuccess';
    }

    async rollSkillCheck(skillName: string, targetScore: number, criticsScoresDefinition = this._defaultCriticsScoresDefinition): Promise<"success" | "fail" | "criticalSuccess" | "epicFail"> {
        const roll = new Roll(`1d20`);
        await roll.roll({async: true});

        let rollResult = roll.total;
        let resultState = this.getRollState(rollResult, targetScore, criticsScoresDefinition);
        let rollTestTextResult = this.formatTestResult(skillName, resultState);

        const messageData = roll.toMessage({}, {create: false});
        let content = `<p>${skillName}: ${rollTestTextResult} (${rollResult} / ${targetScore})</p> ${await roll.render()}`;
        let activeToken = game.canvas.tokens?._controlled[0]?.document;
        let speaker = ChatMessage.getSpeaker({token: activeToken});
        await ChatMessage.create({messageData, content, speaker});
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
        await roll.roll({async: true});
        const messageData = roll.toMessage({}, {create: false});
        let content = `<p>Dégâts: ${roll.total}</p> ${await roll.render()}`
        await ChatMessage.create({...messageData, content});
        return roll;
    }

    /**
     * @param {string} parryMessage
     * @param {number} targetScore
     * @return {Promise<"success"|"fail"|"criticalSuccess"|"epicFail">}
     */
    rollParry(parryMessage, targetScore) {
        return this.rollSkillCheck(parryMessage, targetScore, this._parryCriticsScoresDefinition);
    }

    /**
     * @param {string} attackName
     * @param {number} targetScore
     * @param {string} damageDice
     * @return {Promise<"success"|"fail"|"criticalSuccess"|"epicFail">}
     */
    async rollAttack(attackName, targetScore, damageDice) {
        const actionResult = await this.rollSkillCheck(attackName, targetScore);
        if (this.isSuccess(actionResult)) {
            await this.rollDamage(damageDice);
        }
        return actionResult;
    }

    /**
     * @param {('success'|'fail'|'criticalSuccess'|'epicFail')} resultState
     */
    playEpicSoundIfNeeded(resultState) {
        if (resultState === 'criticalSuccess') {
            AudioHelper.play({
                src: 'systems/naheulbook/assets/sounds/critical-success.mp3',
                volume: 0.20,
                loop: false,
                autoplay: true
            }, true);
        } else if (resultState === 'epicFail') {
            AudioHelper.play({
                src: 'systems/naheulbook/assets/sounds/epic-fail.mp3',
                volume: 0.20,
                loop: false,
                autoplay: true
            }, true);
        }
    }
}
