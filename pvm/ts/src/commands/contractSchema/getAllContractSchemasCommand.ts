import { ISignedResponse, ISignedCommand } from "../interfaces";
import { ContractSchema } from "../../models/contractSchema";
import contractSchemas from "../../schema/contractSchemas";
import { signResult } from "../abstractSignedCommand";

export class GetAllContractSchemasCommand implements ISignedCommand<ContractSchema[]> {
    constructor(private readonly max: number = 50, private readonly privateKey: string) { }

    public async execute(): Promise<ISignedResponse<ContractSchema[]>> {
        const existingContractSchemas = await contractSchemas.find().limit(this.max);

        if (!existingContractSchemas) {
            throw new Error("No contract schemas found");
        }

        const schemas = existingContractSchemas.map(schema => ContractSchema.fromDocument(schema));
        return signResult(schemas, this.privateKey);
    }
}
