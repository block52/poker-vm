import { ISignedResponse, ISignedCommand } from "../interfaces";
import { ContractSchema } from "../../models/contractSchema";
import contractSchemas from "../../schema/contractSchemas";
import { signResult } from "../abstractSignedCommand";

export class GetContractSchemaCommand implements ISignedCommand<ContractSchema | null> {
    constructor(private readonly hash: string, private readonly privateKey: string) { }

    public async execute(): Promise<ISignedResponse<ContractSchema | null>> {
        const existingContractSchema = await contractSchemas.findOne({ hash: this.hash });

        if (!existingContractSchema) {
            throw new Error(`Contract schema not found: ${this.hash}`);
        }

        const commandResult = ContractSchema.fromDocument(existingContractSchema);
        return signResult(commandResult, this.privateKey);
    }
}
