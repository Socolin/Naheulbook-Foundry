import {CharacterGroupResponse} from './character-group-response';

export interface GroupGroupInviteResponse {
    id: number;
    name: string;
    origin: string;
    jobs: string[];
    fromGroup: boolean;
    group: CharacterGroupResponse;
}
