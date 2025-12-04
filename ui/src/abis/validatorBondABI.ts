/**
 * Validator Bond Contract ABI
 *
 * This contract handles USDC bonding for validators.
 * Validators must bond USDC to participate in the network.
 */

export const validatorBondABI = [
    {
        inputs: [
            { name: "amount", type: "uint256" },
            { name: "dns", type: "string" },
            { name: "moniker", type: "string" },
            { name: "sslEnabled", type: "bool" },
            { name: "deployExecutionLayer", type: "bool" },
        ],
        name: "bond",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "amount", type: "uint256" }],
        name: "unbond",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ name: "validator", type: "address" }],
        name: "getBondedAmount",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ name: "validator", type: "address" }],
        name: "getValidatorInfo",
        outputs: [
            { name: "dns", type: "string" },
            { name: "moniker", type: "string" },
            { name: "bondedAmount", type: "uint256" },
            { name: "sslEnabled", type: "bool" },
            { name: "isActive", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getValidators",
        outputs: [{ name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "minimumBond",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "usdcToken",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "validator", type: "address" },
            { indexed: false, name: "amount", type: "uint256" },
            { indexed: false, name: "dns", type: "string" },
            { indexed: false, name: "moniker", type: "string" },
        ],
        name: "ValidatorBonded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "validator", type: "address" },
            { indexed: false, name: "amount", type: "uint256" },
        ],
        name: "ValidatorUnbonded",
        type: "event",
    },
] as const;

// Contract address - to be updated with actual deployment address
export const VALIDATOR_BOND_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
