import {MonsterIconGenerator} from './monster-icon-generator';
import {Monster} from '../naheulbook-api/models/monster.model';
import {NaheulbookLogger} from '../utils/naheulbook-logger';
import {InitializedGame} from '../models/misc/game';

/**
 * Store generated monster icons as files in the world folder, one file per color/number combination.
 *
 * Foundry extracts base64 images to a file with a fixed name per document (`assets/actors/<id>-img.png`), so
 * re-generating the icon would keep the same url and the browser / texture cache would keep showing the old icon.
 * Using a file named after the color and number gives a different url each time the icon changes.
 */
export class MonsterIconStore {
    private static readonly source = 'data';
    private readonly folder: string;
    private readonly iconPaths = new Map<string, Promise<string>>();
    private existingFiles?: Promise<Set<string>>;

    constructor(
        private readonly monsterIconGenerator: MonsterIconGenerator,
        private readonly logger: NaheulbookLogger,
        game: InitializedGame,
    ) {
        this.folder = `worlds/${game.world.id}/naheulbook-monster-icons`;
    }

    isGeneratedIcon(src: string | null | undefined): boolean {
        if (!src)
            return true;
        if (src.startsWith('data:'))
            return true;
        // Icons stored by this class
        if (src.startsWith(this.folder + '/'))
            return true;
        // Base64 icons extracted by Foundry server when the actor/token was created / updated
        return /\/assets\/(actors|scenes)\/[^/]+\.png$/.test(src);
    }

    async getMonsterIconPath(monster: Monster): Promise<string> {
        const color = (monster.data.color || 'black').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const fileName = `monster-${color}-${monster.data.number || 0}.png`;

        let iconPath = this.iconPaths.get(fileName);
        if (!iconPath) {
            iconPath = this.getOrUploadIcon(fileName, () => this.monsterIconGenerator.createMonsterIcon(monster));
            this.iconPaths.set(fileName, iconPath);
            iconPath.catch(() => this.iconPaths.delete(fileName));
        }
        return iconPath;
    }

    /**
     * Get a version of the given token image with a big skull on it.
     */
    async getDeadIconPath(sourceSrc: string): Promise<string> {
        const baseName = (sourceSrc.startsWith('data:') ? 'inline' : (sourceSrc.split('/').pop() ?? '').replace(/\.[^.]*$/, ''))
            .replace(/[^a-zA-Z0-9-]/g, '')
            .substring(0, 50);
        const fileName = sourceSrc.startsWith(this.folder + '/')
            ? `${baseName}-dead.png`
            : `dead-${baseName}-${this.hash(sourceSrc)}.png`;

        let iconPath = this.iconPaths.get(fileName);
        if (!iconPath) {
            iconPath = this.getOrUploadIcon(fileName, () => this.monsterIconGenerator.createDeadIcon(sourceSrc));
            this.iconPaths.set(fileName, iconPath);
            iconPath.catch(() => this.iconPaths.delete(fileName));
        }
        return iconPath;
    }

    private hash(value: string): string {
        let hash = 5381;
        for (let i = 0; i < value.length; i++)
            hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
        return (hash >>> 0).toString(16);
    }

    private async getOrUploadIcon(fileName: string, generateIcon: () => Promise<string>): Promise<string> {
        const path = `${this.folder}/${fileName}`;
        const existingFiles = await this.getExistingFiles();
        if (existingFiles.has(path))
            return path;

        const dataUrl = await generateIcon();
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, {type: 'image/png'});
        const result = await foundry.applications.apps.FilePicker.implementation.upload(MonsterIconStore.source, this.folder, file, {}, {notify: false});
        if (!result || !('path' in result))
            throw new Error(`Failed to upload monster icon ${path}`);
        existingFiles.add(result.path);
        return result.path;
    }

    private getExistingFiles(): Promise<Set<string>> {
        if (!this.existingFiles) {
            this.existingFiles = this.loadExistingFiles();
            this.existingFiles.catch(() => this.existingFiles = undefined);
        }
        return this.existingFiles;
    }

    private async loadExistingFiles(): Promise<Set<string>> {
        const FilePicker = foundry.applications.apps.FilePicker.implementation;
        try {
            const result = await FilePicker.browse(MonsterIconStore.source, this.folder);
            return new Set(result.files.map(f => decodeURIComponent(f)));
        } catch {
            this.logger.info(`Creating folder ${this.folder} to store monster icons`);
            await FilePicker.createDirectory(MonsterIconStore.source, this.folder);
            return new Set();
        }
    }
}
