import {IItemData} from '../shared';
import {IActiveStatsModifier} from '../shared';
import {ItemTemplateResponse} from './item-template-response';

export interface ItemResponse {
    id: number;
    data: IItemData;
    modifiers?: IActiveStatsModifier[];
    containerId?: number;
    template: ItemTemplateResponse;
}
