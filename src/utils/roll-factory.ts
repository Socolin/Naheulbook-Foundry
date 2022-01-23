import {singleton} from 'tsyringe';

export type Evaluated<T extends Roll> = T & { _evaluated: true; _total: number; get total(): number };

@singleton()
export class RollFactory {
    public async createRoll(formula: string): Promise<Evaluated<Roll>> {
        let roll = new Roll(formula);
        await roll.roll({async: true});
        if (roll.total === undefined)
            throw new Error('.roll() failed to provide total')
        return roll as Evaluated<Roll>;
    }
}
