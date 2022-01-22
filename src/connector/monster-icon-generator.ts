import {Monster} from '../naheulbook-api/models/monster.model';

export class MonsterIconGenerator {
    private readonly icon: Promise<HTMLImageElement>;

    constructor() {
        const imageElement = new Image();
        this.icon = new Promise(((resolve, _) => {
            imageElement.onload = () => resolve(imageElement);
        }));
        imageElement.src = 'systems/naheulbook/assets/images/monster.svg';
    }

    async createMonsterIcon(monster: Monster): Promise<string> {
        let icon = await this.icon;

        let canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        let monsterColor = monster.data.color ? `#${monster.data.color}` : 'black';
        let monsterNumber = monster.data.number;

        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error('Failed to get 2d context from canvas');
        }
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

    async createMonsterEffectIconColor(color: string): Promise<string> {
        let monsterColor = color ? `#${color}` : 'black';

        let canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error('Failed to get 2d context from canvas');
        }
        ctx.fillStyle = monsterColor;

        let circle = new Path2D();
        circle.arc(50, 50, 50, 0, 2 * Math.PI);
        ctx.fill(circle);

        return canvas.toDataURL("image/png");
    }

    async createMonsterEffectIconNumber(monsterNumber: number): Promise<string | undefined> {
        if (!monsterNumber)
            return undefined;

        let canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error('Failed to get 2d context from canvas');
        }

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
