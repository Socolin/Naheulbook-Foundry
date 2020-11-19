import {IActiveStatsModifier, IGroupConfig} from '../shared';
import {ItemResponse} from './item-response';
import {SpecialityResponse} from './speciality-response';
import {CharacterGroupInviteResponse} from './character-group-invite-response';
import {CharacterSex} from '../shared/enums';
import {Guid} from '../shared/util';
import {CharacterGroupResponse} from './character-group-response';

export interface CharacterResponse {
    id: number;
    name: string;
    sex: CharacterSex;
    originId: Guid;
    isNpc: boolean;
    ev?: number;
    ea?: number;
    level: number;
    experience: number;
    fatePoint: number;
    stats: {
        AD: number;
        COU: number;
        CHA: number;
        FO: number;
        INT: number;
    };
    statBonusAd?: string;
    jobIds: Guid[];
    skillIds: Guid[];
    group?: CharacterGroupResponse;
    modifiers: IActiveStatsModifier[];
    specialities: SpecialityResponse[];
    items: ItemResponse[];
    invites: CharacterGroupInviteResponse[];
}

export interface CharacterFoGmResponse extends CharacterResponse {
    isActive: boolean;
    color: string;
    gmData?: {
        mankdebol: number;
        debilibeuk: number;
    };
    ownerId?: number;
    target?: {
        id: number;
        isMonster: boolean;
    };
}
