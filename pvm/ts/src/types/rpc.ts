import { RPCMethods } from "@bitcoinbrisbane/block52";

// Since we can't modify the imported RPCMethods enum directly, 
// we'll define our own constant for the reset blockchain method
export const RESET_BLOCKCHAIN = "reset_blockchain"; // todo move to SDK if we keep

// Define a type that includes both RPCMethods and our custom methods
export type ExtendedRPCMethods = RPCMethods | typeof RESET_BLOCKCHAIN;

export const READ_METHODS = [
    RPCMethods.GET_ACCOUNT,
    RPCMethods.GET_BLOCK_BY_HASH,
    RPCMethods.GET_BLOCK,
    RPCMethods.GET_BLOCKS,
    RPCMethods.GET_CLIENT,
    RPCMethods.GET_CONTRACT_SCHEMA,
    RPCMethods.GET_GAME_STATE,
    RPCMethods.GET_LAST_BLOCK,
    RPCMethods.GET_MEMPOOL,
    RPCMethods.GET_NODES,
    RPCMethods.GET_SHARED_SECRET,
    RPCMethods.GET_TRANSACTION,
    RPCMethods.GET_TRANSACTIONS
];

export const WRITE_METHODS = [
    RPCMethods.BLOCK,
    RPCMethods.BURN,
    RPCMethods.CREATE_ACCOUNT,
    RPCMethods.CREATE_CONTRACT_SCHEMA,
    RPCMethods.MINE,
    RPCMethods.MINED_BLOCK_HASH,
    RPCMethods.MINT,
    RPCMethods.TRANSFER,
    RPCMethods.DEAL
];

export const CONTROL_METHODS: (RPCMethods | string)[] = [
    RPCMethods.PURGE, 
    RPCMethods.START, 
    RPCMethods.STOP, 
    RPCMethods.SHUTDOWN,
    RESET_BLOCKCHAIN
];
