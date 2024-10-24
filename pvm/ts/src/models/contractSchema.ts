import { createHash } from "crypto";
import { IContractSchemaDocument, IJSONModel } from "./interfaces";

export class ContractSchema implements IJSONModel {
    private readonly _hash: string;
    private readonly _category: string;
    private readonly _name: string;
    private readonly _schema: any;

    constructor(
        category: string,
        name: string,
        jsonSchema: any,
        hash?: string
    ) {
        this._schema = jsonSchema;

        // If a hash is provided, check that it matches the calculated hash.
        const calculatedHash = ContractSchema.makeHash(jsonSchema);
        if (hash && hash !== calculatedHash) {
            throw new Error("Hash mismatch");
        }
        this._hash = calculatedHash;
        this._category = category;
        this._name = name;
        this._schema = jsonSchema;
    }

    public static makeHash(jsonSchema: any): string {
        return createHash("SHA256")
            .update(JSON.stringify(jsonSchema))
            .digest("hex");
    }

    public toJson(): any {
        return {
            category: this._category,
            name: this._name,
            schema: this._schema,
            hash: this._hash
        };
    }

    public toDocument(): IContractSchemaDocument {
        return {
            category: this._category,
            name: this._name,
            schema: this._schema,
            hash: this._hash
        };
    }

    public static fromDocument(
        document: IContractSchemaDocument
    ): ContractSchema {
        return new ContractSchema(
            document.category,
            document.name,
            document.schema,
            document.hash
        );
    }

    public get hash(): string {
        return this._hash;
    }

    public get schema(): any {
        return this._schema;
    }
}
