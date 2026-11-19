/**
 * Injection token for the `game` global, once Foundry is fully initialized (after the `ready` hook)
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class InitializedGame {
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface InitializedGame extends ReadyGame {
}
