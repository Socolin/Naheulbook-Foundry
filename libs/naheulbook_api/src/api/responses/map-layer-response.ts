import {MapMarkerResponse} from './map-marker-response';

export interface MapLayerResponse {
    id: number;
    name: string;
    source: 'official' | 'private';
    isGm: boolean;
    markers: MapMarkerResponse[];
}
