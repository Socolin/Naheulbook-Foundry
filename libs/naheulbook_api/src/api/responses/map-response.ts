import {MapData, MapImageData} from '../shared';
import {MapLayerResponse} from './map-layer-response';

export interface MapResponse {
    id: number;
    name: string;
    data: MapData;
    imageData: MapImageData;
    layers: MapLayerResponse[];
}
