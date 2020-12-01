export class MonsterIconGenerator {
    /**
     * @type {Promise<HTMLImageElement>}
     * @private
     */
    _icon;

    constructor() {
        const imageElement = new Image();
        this._icon = new Promise(((resolve, _) => {
            imageElement.onload = () => resolve(imageElement);
        }));
        imageElement.src = 'systems/naheulbook/assets/images/monster.svg';
    }

    /**
     * @param {Monster} monster
     * @returns {Promise<string>}
     */
    async createMonsterIcon(monster) {
        let icon = await this._icon;

        let canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        let monsterColor = monster.data.color ? `#${monster.data.color}` : 'black';
        let monsterNumber = monster.data.number;

        let ctx = canvas.getContext("2d");
        ctx.fillStyle = monsterColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(icon, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";

        if (monsterNumber) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = '120px Roboto, "Helvetica Neue", sans-serif';
            ctx.globalAlpha = 0.7;
            ctx.fillText(monsterNumber.toString(), 50, 60);
            ctx.globalAlpha = 1;
            ctx.lineWidth = 3;
            ctx.strokeText(monsterNumber.toString(), 50, 60);
        }

        return canvas.toDataURL("image/png");
    }

    /**
     * @param {string} color
     * @returns {Promise<string>}
     */
    async createMonsterEffectIconColor(color) {
        let monsterColor = color ? `#${color}` : 'black';

        let canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        let ctx = canvas.getContext("2d");
        ctx.fillStyle = monsterColor;

        let circle = new Path2D();
        circle.arc(50, 50, 50, 0, 2 * Math.PI);
        ctx.fill(circle);

        return canvas.toDataURL("image/png");
    }

    /**
     * @param {number} monsterNumber
     * @returns {Promise<string>}
     */
    async createMonsterEffectIconNumber(monsterNumber) {
        if (!monsterNumber)
            return undefined;

        let canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        let ctx = canvas.getContext("2d");

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = '120px serif';
        ctx.fillText(monsterNumber.toString(), 50, 60);
        ctx.lineWidth = 3;
        ctx.strokeText(monsterNumber.toString(), 50, 60);

        return canvas.toDataURL("image/png");
    }
}
