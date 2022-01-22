import {singleton} from 'tsyringe';

export type RolledRoll = Roll & { total: number }

@singleton()
export class RollFactory {
    public async createRoll(formula: string): Promise<RolledRoll> {
        let roll = new Roll(formula);
        await roll.roll({async: true});
        if (!roll.total)
            throw new Error('.roll() failed to provide total')
        return roll as RolledRoll;
    }
}
