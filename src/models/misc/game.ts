import {
    ConfiguredCollectionClassForName
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/game';
import {ConfiguredDocumentClass} from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';

export class InitializedGame extends Game {
    users: ConfiguredCollectionClassForName<'User'>;
    folders: ConfiguredCollectionClassForName<'Folder'>;
    actors: ConfiguredCollectionClassForName<'Actor'>;
    items: ConfiguredCollectionClassForName<'Item'>;
    scenes: ConfiguredCollectionClassForName<'Scene'>;
    combats: ConfiguredCollectionClassForName<'Combat'>;
    journal: ConfiguredCollectionClassForName<'JournalEntry'>;
    macros: ConfiguredCollectionClassForName<'Macro'>;
    playlists: ConfiguredCollectionClassForName<'Playlist'>;
    tables: ConfiguredCollectionClassForName<'RollTable'>;
    messages: ConfiguredCollectionClassForName<'ChatMessage'>;
    override get user(): StoredDocument<InstanceType<ConfiguredDocumentClass<typeof User>>> {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return super.user!;
    }
}
