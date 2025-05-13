import { ContractSchema } from "../../models/contractSchema";
import contractSchemas from "../../schema/contractSchemas";
import { signResult } from "../abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "../interfaces";

export class CreateContractSchemaCommand implements ISignedCommand<string> {
    constructor(private _category: string, private _name: string, private _schema: any, private readonly privateKey: string) { }

    public async execute(): Promise<ISignedResponse<string>> {
        const contractSchema = new ContractSchema(this._category, this._name, this._schema);
        const existingContractSchema = await contractSchemas.findOne({ hash: contractSchema.hash });

        if (existingContractSchema) {
            return signResult(existingContractSchema.address, this.privateKey);
        }

        await contractSchemas.create(contractSchema.toDocument());
        return signResult(contractSchema.address, this.privateKey);
    }
}
