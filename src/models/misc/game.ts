/**
 * Injection token for the `game` global, once Foundry is fully initialized (after the `ready` hook)
 */
export class InitializedGame {
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InitializedGame extends ReadyGame {
}
