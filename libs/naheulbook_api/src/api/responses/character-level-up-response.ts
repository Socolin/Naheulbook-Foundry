import {ActiveStatsModifier} from '../../shared';
import {Guid} from '../shared/util';
import {SpecialityResponse} from './speciality-response';

export interface CharacterLevelUpResponse {
    newModifiers: ActiveStatsModifier[];
    newSkillIds: Guid[];
    newSpecialities: SpecialityResponse[];
    newLevel: number;
}
