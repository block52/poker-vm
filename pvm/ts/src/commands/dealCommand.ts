import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { signResult } from "./abstractSignedCommand";
import { ICommand, ISignedResponse } from "./interfaces";
import { GameManagement, getGameManagementInstance } from "../state/gameManagement";
import TexasHoldemGame from "../engine/texasHoldem";
import contractSchemas from "../schema/contractSchemas";
import { ContractSchemaManagement, getContractSchemaManagement } from "../state/contractSchemaManagement";

export class DealCommand implements ICommand<ISignedResponse<any>> {
    private readonly gameManagement: GameManagement;
    private readonly contractSchemas: ContractSchemaManagement;
    private readonly mempool: Mempool;

    constructor(private readonly gameAddress: string, private readonly playerAddress: string, private readonly privateKey: string) {
        this.gameManagement = getGameManagementInstance();
        this.contractSchemas = getContractSchemaManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<any>> {
        try {
            // Check if the address is a game contract
            if (await this.isGameContract(this.gameAddress)) {
                const [json, gameOptions] = await Promise.all([
                    this.gameManagement.get(this.gameAddress),
                    this.contractSchemas.getGameOptions(this.gameAddress)
                ]);

                const game: TexasHoldemGame = TexasHoldemGame.fromJson(json, gameOptions);

                if (!game) {
                    throw new Error("Game not found");
                }

                // Deal the cards
                game.deal();

                // Save the updated game state
                const updatedJson = game.toJson();
                await this.gameManagement.saveFromJSON(updatedJson);

                // Create a transaction record for this action
                const dealTx: Transaction = await Transaction.create(
                    this.gameAddress,
                    this.playerAddress,
                    0n, // No value transfer
                    0n,
                    this.privateKey,
                    "deal"
                );

                // Add the transaction to the mempool
                await this.mempool.add(dealTx);

                // Return the signed transaction like in TransferCommand
                return signResult(dealTx, this.privateKey);
            } else {
                throw new Error("Address is not a valid game contract");
            }
        } catch (e) {
            console.error(`Error in deal command:`, e);
            throw new Error("Error dealing cards");
        }
    }

    private async isGameContract(address: string): Promise<boolean> {
        const existingContractSchema = await contractSchemas.find({ address: address });
        return existingContractSchema !== undefined;
    }
}
