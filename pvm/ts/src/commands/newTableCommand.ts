import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { getGameManagementInstance } from "../state/gameManagement";
import { IContractSchemaManagement, IGameManagement } from "../state/interfaces";
import { getContractSchemaManagement } from "../state";

export class NewTableCommand implements ISignedCommand<string> {
    private readonly gameManagement: IGameManagement;
    private readonly contractSchemas: IContractSchemaManagement;

    constructor(private readonly owner: string, private readonly schemaAddress: string, private readonly privateKey: string) {
        this.gameManagement = getGameManagementInstance();
        this.contractSchemas = getContractSchemaManagement();
    }

    public async execute(): Promise<ISignedResponse<string>> {
        // Check if the schema address is valid
        const gameOptions = await this.contractSchemas.getGameOptions(this.schemaAddress);
        if (!gameOptions) {
            throw new Error(`Game options not found for schema address: ${this.schemaAddress}`);
        }

        const address = await this.gameManagement.create(0n, this.schemaAddress, gameOptions);

        return signResult(address, this.privateKey);
    }
}
