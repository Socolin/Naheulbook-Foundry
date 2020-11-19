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
}
