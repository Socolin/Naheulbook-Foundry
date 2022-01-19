import {IGroupConfig} from '../shared';

export interface CharacterGroupInviteResponse {
    groupName: string;
    groupId: number;
    config: IGroupConfig
}
