import {GroupGroupInviteResponse} from './group-group-invite-response';
import {IGroupConfig, IGroupData} from '../shared';

export interface GroupResponse {
    id: number;
    name: string;
    data?: IGroupData;
    config: IGroupConfig;
    characterIds: number[];
    invites: GroupGroupInviteResponse[];
}
