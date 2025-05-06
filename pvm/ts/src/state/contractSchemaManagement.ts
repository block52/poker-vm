import { StateManager } from "./stateManager";
import ContractSchemas from "../schema/contractSchemas";
import { GameOptions } from "@bitcoinbrisbane/block52";

export class ContractSchemaManagement extends StateManager {

    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    async getGameOptions(address: string): Promise<GameOptions> {
        const contract = await ContractSchemas.findOne({
            address
        });

        if (!contract) {
            throw new Error("Contract not found");
        }

        const args = contract.schema.split(",");
        if (args.length !== 9) {
            throw new Error("Invalid schema");
        }

        const options: GameOptions = {
            minBuyIn: BigInt(args[6]),
            maxBuyIn: BigInt(args[7]),
            minPlayers: parseInt(args[2]),
            maxPlayers: parseInt(args[3]),
            smallBlind: BigInt(args[4]),
            bigBlind: BigInt(args[5]),
            timeout: parseInt(args[8]),
        };

        return options;
    }
}

let instance: ContractSchemaManagement;
export const getContractSchemaManagement = (): ContractSchemaManagement => {
    if (!instance) {
        instance = new ContractSchemaManagement();
    }
    return instance;
}
