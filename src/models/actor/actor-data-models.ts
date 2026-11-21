// Data models for the actor types, replacing the deprecated template.json.
// Every value written by the connectors must be declared here: values not part of the schema are dropped.

const fields = foundry.data.fields;

function resourceField(initialValue: number, initialMax: number) {
    return new fields.SchemaField({
        min: new fields.NumberField({initial: 0}),
        value: new fields.NumberField({initial: initialValue}),
        max: new fields.NumberField({initial: initialMax}),
    });
}

function baseStatsSchema() {
    return {
        ev: resourceField(10, 10),
        ea: resourceField(1, 3),
        at: new fields.NumberField({initial: 8}),
        prd: new fields.NumberField({initial: 10}),
        pr: new fields.NumberField({initial: 0}),
        pr_magic: new fields.NumberField({initial: 0}),
        esq: new fields.NumberField({initial: 0}),
        resm: new fields.NumberField({initial: 0}),
        mpsy: new fields.NumberField({initial: 0}),
        mphys: new fields.NumberField({initial: 0}),
    };
}

function characterSchema() {
    return {
        ...baseStatsSchema(),
        naheulbookCharacterId: new fields.NumberField({initial: 0, integer: true}),
        cou: new fields.NumberField({initial: 10}),
        int: new fields.NumberField({initial: 10}),
        cha: new fields.NumberField({initial: 10}),
        ad: new fields.NumberField({initial: 10}),
        fo: new fields.NumberField({initial: 10}),
        discretionModifier: new fields.NumberField({initial: 0}),
        throwModifier: new fields.NumberField({initial: 0}),
        danseModifier: new fields.NumberField({initial: 0}),
        pi: new fields.NumberField({initial: 0}),
        spellDamageBonus: new fields.NumberField({initial: 0}),
        weapons: new fields.ArrayField(new fields.ObjectField()),
    };
}

function monsterSchema() {
    return {
        ...baseStatsSchema(),
        naheulbookMonsterId: new fields.NumberField({initial: 0, integer: true}),
        cou: new fields.NumberField({initial: 10}),
        chercheNoise: new fields.BooleanField({initial: false}),
        damages: new fields.ArrayField(new fields.ObjectField()),
    };
}

// Old worlds stored some stats (like esq) as a resource object `{min, value}` instead of a number
function migrateLegacyNumberFields(source: Record<string, unknown>, schema: Record<string, unknown>) {
    for (const [key, field] of Object.entries(schema)) {
        if (!(field instanceof fields.NumberField))
            continue;
        const value = source[key];
        if (value && typeof value === 'object') {
            const legacyValue = (value as { value?: unknown }).value;
            source[key] = typeof legacyValue === 'number' ? legacyValue : null;
        }
    }
}

export class CharacterDataModel extends foundry.abstract.TypeDataModel<ReturnType<typeof characterSchema>, Actor.Implementation> {
    static override defineSchema() {
        return characterSchema();
    }

    static override migrateData(source: Record<string, unknown>) {
        migrateLegacyNumberFields(source, characterSchema());
        return super.migrateData(source);
    }
}

export class MonsterDataModel extends foundry.abstract.TypeDataModel<ReturnType<typeof monsterSchema>, Actor.Implementation> {
    static override defineSchema() {
        return monsterSchema();
    }

    static override migrateData(source: Record<string, unknown>) {
        migrateLegacyNumberFields(source, monsterSchema());
        // template.json defined chercheNoise as `{value: boolean}` while the monster connector writes a boolean
        const chercheNoise = source.chercheNoise;
        if (chercheNoise && typeof chercheNoise === 'object') {
            source.chercheNoise = !!(chercheNoise as { value?: unknown }).value;
        }
        return super.migrateData(source);
    }
}
