import {DescribedFlagResponse} from '../api/responses';

export class Flag {
    type: string;
    data?: any;
}

export interface FlagData {
    source: {
        type: string,
        name: string,
    };
    data?: any;
}

export class DescribedFlag {
    description: string;
    flags: Flag[] = [];

    static fromResponse(response: DescribedFlagResponse): DescribedFlag {
        let describedFlag = new DescribedFlag();
        describedFlag.description = response.description;
        describedFlag.flags = response.flags || [];
        return describedFlag;
    }

    static fromResponses(responses: DescribedFlagResponse[]): DescribedFlag[] {
        let flags: DescribedFlag[] = [];

        if (responses) {
            for (let flagJsonData of responses) {
                flags.push(DescribedFlag.fromResponse(flagJsonData));
            }
        }

        return flags;
    }

    hasFlag(flagName: string): boolean {
        let i = this.flags.findIndex(f => f.type === flagName);
        return i !== -1;
    }

    getFlagDatas(data: {[flagName: string]: FlagData[]}, source: {type: string, name: string}): void {
        for (let flag of this.flags) {
            if (!(flag.type in data)) {
                data[flag.type] = [];
            }
            data[flag.type].push({data: flag.data, source: source});
        }
    }
}
