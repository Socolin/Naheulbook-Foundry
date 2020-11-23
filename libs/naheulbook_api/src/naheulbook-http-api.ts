export class NaheulbookHttpApi {
    public constructor(private readonly naheulbookHost: string) {
    }

    public async get<T>(path: string): Promise<T> {
        return this.sendRequest<T>('GET', path);
    }

    public async patch<T>(url: string, data: any): Promise<T> {
        return this.sendRequest<T>('PATCH', url, data);
    }

    private async sendRequest<T>(method: string, path: string, body?: any): Promise<T> {
        let authorizationToken = NaheulbookHttpApi.getAuthorizationToken();
        if (!authorizationToken) {
            throw new Error('Missing authorization token');
        }

        let requestInit: RequestInit = {
            method: method,
            headers: {
                'Authorization': 'Bearer ' + authorizationToken,
            }
        };
        if (body !== undefined) {
            requestInit.body = JSON.stringify(body);
            requestInit.headers['Content-Type'] = 'application/json';
        }
        let result = await fetch(this.naheulbookHost + path, requestInit);

        if (result.ok) {
            return await result.json();
        }

        throw new Error(`Failed to fetch from ${path}: ` + result.status +  ' ' + await result.text());
    }


    public static getAuthorizationToken(): string | undefined {
        let accessToken = localStorage.getItem('naheulbookAccessKey');
        if (!accessToken)
            return;
        return `userAccessToken:${accessToken}`;
    }
}
