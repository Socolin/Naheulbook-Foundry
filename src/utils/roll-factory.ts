import {singleton} from 'tsyringe';

@singleton()
export class RollFactory {
    public async createRoll(formula: string): Promise<Roll.Evaluated<Roll>> {
        let roll = new Roll(formula);
        return await roll.evaluate();
    }
}
