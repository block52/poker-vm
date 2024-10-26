import { ICommand } from "../interfaces";
import { ContractSchema } from "../../models/contractSchema";
import contractSchemas from "../../schema/contractSchemas";
import { AbstractCommand } from "../abstractSignedCommand";

export class GetContractSchemaCommand extends AbstractCommand<ContractSchema | null> {
    constructor(private readonly hash: string, privateKey: string) {
        super(privateKey);
    }

    public async executeCommand(): Promise<ContractSchema | null> {
        const existingContractSchema = await contractSchemas.findOne({ hash: this.hash });
        
        if (!existingContractSchema) {
            throw new Error(`Contract schema not found: ${this.hash}`);
        }

        return ContractSchema.fromDocument(existingContractSchema);
    }
}

