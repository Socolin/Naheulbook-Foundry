import ClickEvent = JQuery.ClickEvent;

export type DialogResultCallback<TResult> = (result: TResult | undefined) => void;

export abstract class DialogBase<TData, TResult> extends Application {
    constructor(
        protected readonly data: TData,
        protected readonly result: DialogResultCallback<TResult>
    ) {
        super();
    }

    override activateListeners(html: JQuery) {
        super.activateListeners(html);

        html.find('[data-dialog-action]').on("click", async (ev: ClickEvent) => {
            switch (ev.currentTarget.dataset.dialogAction) {
                case 'cancel':
                    this.result(undefined);
                    await this.close();
                    break;
                case 'confirm':
                    this.result(this.getResult());
                    await this.close();
                    break;
            }
        });
    }

    protected abstract getResult(): TResult;

    protected _onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            this.result(undefined);
            return this.close();
        }
    }
}
