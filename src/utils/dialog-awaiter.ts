import {singleton} from 'tsyringe';
import {DialogBase, DialogResultCallback} from '../ui/dialog/dialog-base';

@singleton()
export class DialogAwaiter {
    async openAndWaitResult<TDialog extends DialogBase<TData, TResult>, TData, TResult>(
        type: { new(data: TData, result: DialogResultCallback<TResult>): TDialog },
        data: TData
    ): Promise<TResult | undefined> {
        return new Promise<TResult | undefined>((resolve) => {
            let dialog = new type(data, result => resolve(result));
            dialog.render(true);
        });
    }
}
