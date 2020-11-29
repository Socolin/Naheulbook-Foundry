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
            ctx.font = '100px serif';
            ctx.fillText(monsterNumber.toString(), 50, 50);
            ctx.strokeText(monsterNumber.toString(), 50, 50);
        }

        return canvas.toDataURL("image/png");
    }

}
