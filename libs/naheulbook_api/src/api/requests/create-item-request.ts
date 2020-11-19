import {IItemData} from '../shared';
import {Guid} from '../shared/util';

export interface CreateItemRequest {
    itemTemplateId: Guid;
    itemData: IItemData;
}
