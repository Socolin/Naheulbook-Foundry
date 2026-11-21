const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

export type DialogResultCallback<TResult> = (result: TResult | undefined) => void;

export abstract class DialogBase<TData, TResult> extends HandlebarsApplicationMixin(ApplicationV2) {
    static override DEFAULT_OPTIONS: foundry.applications.api.ApplicationV2.DefaultOptions = {
        classes: ['naheulbook'],
        actions: {
            cancel: DialogBase.onCancel,
            confirm: DialogBase.onConfirm,
        },
    };

    private resultSent = false;

    constructor(
        protected readonly dialogData: TData,
        protected readonly result: DialogResultCallback<TResult>
    ) {
        super();
    }

    protected abstract getResult(): TResult | undefined;

    private sendResult(value: TResult | undefined) {
        if (this.resultSent)
            return;
        this.resultSent = true;
        this.result(value);
    }

    protected override _onClose(options: Parameters<foundry.applications.api.ApplicationV2['_onClose']>[0]) {
        super._onClose(options);
        this.sendResult(undefined);
    }

    private static async onCancel(this: DialogBase<unknown, unknown>) {
        await this.close();
    }

    private static async onConfirm(this: DialogBase<unknown, unknown>) {
        this.sendResult(this.getResult());
        await this.close();
    }
}
