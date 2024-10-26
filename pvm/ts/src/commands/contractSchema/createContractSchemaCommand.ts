import { ContractSchema } from "../../models/contractSchema";
import contractSchemas from "../../schema/contractSchemas";
import { AbstractCommand } from "../abstractSignedCommand";
import { ICommand } from "../interfaces";

export class CreateContractSchemaCommand extends AbstractCommand<string>  {

    constructor(private _category: string, private _name: string, private _schema: any, privateKey: string) {
        super(privateKey);
    }

    public async executeCommand(): Promise<string> {    
        const contractSchema = new ContractSchema(this._category, this._name, this._schema);
        const existingContractSchema = await contractSchemas.findOne({ hash: contractSchema.hash });
        if (existingContractSchema) {
            return existingContractSchema.hash;
        }
        await contractSchemas.create(contractSchema.toDocument());
        return contractSchema.hash;
    }
}

