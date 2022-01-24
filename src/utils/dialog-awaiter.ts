import {container, singleton} from 'tsyringe';
import {DialogBase, DialogResultCallback} from '../ui/dialog/dialog-base';

@singleton()
export class DialogAwaiter {
    async openAndWaitResult<TDialog extends DialogBase<TData, TResult>, TData, TResult>(
        type: { new(data: TData, result: DialogResultCallback<TResult>, ...args): TDialog },
        data: TData
    ): Promise<TResult | undefined> {
        return new Promise<TResult | undefined>((resolve) => {
            let childContainer = container.createChildContainer();
            childContainer.register('DIALOG_DATA', {useValue: data});
            childContainer.register('DIALOG_RESULT', {useValue: result => resolve(result)});

            let dialog = childContainer.resolve(type)
            dialog.render(true);
        });
    }

}
