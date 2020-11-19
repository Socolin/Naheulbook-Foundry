import {IActiveStatsModifier, IItemData} from '../shared';

export interface ItemPartialResponse {
    id: number;
    data: IItemData;
    modifiers: IActiveStatsModifier[];
    containerId?: number;
}
