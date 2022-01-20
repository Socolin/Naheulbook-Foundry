import ClickEvent = JQuery.ClickEvent;

export type DialogResultCallback<TResult> = (result: TResult | undefined) => void;

export abstract class DialogBase<TData, TResult> extends Application {
    constructor(
        protected readonly dialogData: TData,
        protected readonly result: DialogResultCallback<TResult>
    ) {
        super();
    }

    override activateListeners(html: JQuery) {
        super.activateListeners(html);

        html.find('[data-dialog-action]').on("click", async (ev: ClickEvent) => {
            switch (ev.currentTarget.dataset.dialogAction) {
                case 'cancel':
                    await this.close();
                    break;
                case 'confirm':
                    this.result(this.getResult());
                    await this.close({selected: true});
                    break;
            }
        });
    }

    override close(options?: Application.CloseOptions & { selected: boolean }) {
        if (!options?.selected) {
            this.result(undefined);
        }
        return super.close(options);
    }

    protected abstract getResult(): TResult | undefined;

    protected _onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            return this.close();
        }
    }
}
