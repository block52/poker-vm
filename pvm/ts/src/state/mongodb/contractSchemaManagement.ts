import { StateManager } from "../stateManager";
import ContractSchemas from "../../schema/contractSchemas";
import { GameOptions } from "@bitcoinbrisbane/block52";
import { IContractSchemaManagement } from "../interfaces";
import { IContractSchemaDocument } from "../../models/interfaces";

export class ContractSchemaManagement extends StateManager implements IContractSchemaManagement {
    constructor() {
        super(process.env.DB_URL || "mongodb://localhost:27017/pvm");
    }

    public async getByAddress(address: string): Promise<IContractSchemaDocument> {
        const contract = await ContractSchemas.findOne({
            address: address
        });

        if (!contract) {
            throw new Error("Contract not found");
        }

        // this is stored in MongoDB as an object / document
        const schema: IContractSchemaDocument = {
            address: contract.address,
            category: contract.category,
            name: contract.name,
            schema: contract.schema,
            hash: contract.hash
        };

        return schema;
    }

    public async getGameOptions(address: string): Promise<GameOptions> {
        const contract = await ContractSchemas.findOne({
            address: address
        });

        if (!contract) {
            throw new Error("Contract not found");
        }

        const args = contract.schema.split(",");
        if (args.length < 8) {
            throw new Error("Invalid schema");
        }

        const timeout = args[8] ? parseInt(args[8]) : 30000; // Default timeout of 30 seconds

        const options: GameOptions = {
            minBuyIn: BigInt(args[6]),
            maxBuyIn: BigInt(args[7]),
            minPlayers: parseInt(args[2]),
            maxPlayers: parseInt(args[3]),
            smallBlind: BigInt(args[4]),
            bigBlind: BigInt(args[5]),
            timeout: timeout
        };

        return options;
    }

    public static parseSchema(schema: string): GameOptions {

        // Example schema: "category,name,2,10,1000,2000,50000,1000000,30000"
        // Ensure the schema is a valid string via a Regular Expression
        if (!/^[^,]+,[^,]+(?:,\d+)+$/.test(schema)) {
            throw new Error("Invalid schema format");
        }

        const args = schema.split(",");
        if (args.length < 8) {
            throw new Error("Invalid schema");
        }

        const timeout = args[8] ? parseInt(args[8]) : 30000; // Default timeout of 30 seconds

        const options: GameOptions = {
            minBuyIn: BigInt(args[6]),
            maxBuyIn: BigInt(args[7]),
            minPlayers: parseInt(args[2]),
            maxPlayers: parseInt(args[3]),
            smallBlind: BigInt(args[4]),
            bigBlind: BigInt(args[5]),
            timeout: timeout
        };

        return options;
    }
}

let instance: ContractSchemaManagement;
export const getContractSchemaManagementInstance = (): IContractSchemaManagement => {
    if (!instance) {
        instance = new ContractSchemaManagement();
    }
    return instance;
};
