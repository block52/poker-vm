import { ethers, ZeroAddress } from "ethers";

export class Validator {
    public readonly token = "0xe7d69c2351cdb850D5DB9e4eCd9C7a1059Db806a";
    public readonly vault = "0x36c347E374Bf272AdD3B0FDfA5821795eBC0Fc9d";

    constructor(readonly node: string = "http://localhost:8545") {
    }

    public async isValidator(address: string): Promise<boolean> {

        const provider = new ethers.JsonRpcProvider(this.node);
        const contract = new ethers.Contract(this.vault, ["function isValidator(address) view returns (bool)"], provider);

        return await contract.isValidator(address);
    }

    public async getNextValidatorAddress(): Promise<string> {
        return ZeroAddress;
    }
}

let validatorInstance: Validator | null = null;

export function getValidatorInstance(): Validator {
    if (!validatorInstance) {
        validatorInstance = new Validator();
    }
    return validatorInstance;
}
