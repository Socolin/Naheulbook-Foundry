export interface MapMarkerLinkResponse {
    id: number;
    name?: string;
    targetMapId: number;
    targetMapName: string;
    targetMapIsGm: boolean;
    targetMapMarkerId?: number;
}
