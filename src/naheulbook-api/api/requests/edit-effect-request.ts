import {CreateEffectRequest} from './create-effect-request';

export interface EditEffectRequest extends CreateEffectRequest {
    subCategoryId: number;
}
