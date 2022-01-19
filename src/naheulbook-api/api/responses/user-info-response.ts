export class UserInfoResponse {
    id: number;
    displayName?: string;
    admin: boolean;
    linkedWithFb: boolean;
    linkedWithGoogle: boolean;
    linkedWithTwitter: boolean;
    linkedWithMicrosoft: boolean;
    showInSearch: boolean;
}
