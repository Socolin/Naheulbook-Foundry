import * as signalR from '@microsoft/signalr';

export class NaheulbookApi {
    public test(): string {
        console.log('Hello from bazel');
        return 'hello from bazel';
    }

    public async test2() {
        let result = await fetch("https://naheulbook.fr/api/v2/jobs");
        if (result.ok) {
            return await result.json();
        }
        throw new Error("Failed to fetch from naheulbook api");
    }

    public async test3() {
        let connection = new signalR.HubConnectionBuilder()
            .withUrl(" http://localhost:5000/ws/listen")
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connection.on("event", data => {
            console.log(data);
        });

        connection.start()
            .then(() => connection.invoke("SubscribeCharacter", 42));
    }
}
