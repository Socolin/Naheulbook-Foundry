import {Guid} from '../shared/util';
import {SpecialityResponse} from './speciality-response';

export interface CharacterLevelUpResponse {
    newModifiers: any[];
    newSkillIds: Guid[];
    newSpecialities: SpecialityResponse[];
    newLevel: number;
}
