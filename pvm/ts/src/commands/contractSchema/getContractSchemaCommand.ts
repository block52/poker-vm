import { ICommand } from "../interfaces";
import { ContractSchema } from "../../models/contractSchema";
import contractSchemas from "../../schema/contractSchemas";

export class GetContractSchemaCommand implements ICommand<ContractSchema | null> {
    constructor(private readonly hash: string) {}

    public async execute(): Promise<ContractSchema | null> {
        const existingContractSchema = await contractSchemas.findOne({ hash: this.hash });
        
        if (!existingContractSchema) {
            return null;
        }

        return ContractSchema.fromDocument(existingContractSchema);
    }
}

