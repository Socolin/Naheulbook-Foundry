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

    /**
     * Draw a big skull (same icon as the "Dead" status) over an existing token image, to mark the monster as dead.
     */
    async createDeadIcon(sourceSrc: string): Promise<string> {
        const size = 200;
        const [source, skull] = await Promise.all([
            this.loadImage(sourceSrc),
            this.loadImage(CONFIG.controlIcons.defeated),
        ]);

        let canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        let ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error('Failed to get 2d context from canvas');
        }

        ctx.drawImage(source, 0, 0, size, size);

        // Darken the image so the skull stands out
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = "source-over";

        const skullSize = size * 0.9;
        const offset = (size - skullSize) / 2;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = size * 0.05;
        ctx.drawImage(skull, offset, offset, skullSize, skullSize);

        return canvas.toDataURL("image/png");
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image ${src}`));
            image.src = src;
        });
    }
}
