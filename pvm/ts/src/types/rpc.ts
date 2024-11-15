import { RPCMethods } from "@bitcoinbrisbane/block52";

export const READ_METHODS = [
    RPCMethods.GET_ACCOUNT,
    RPCMethods.GET_BLOCK,
    RPCMethods.GET_BLOCKS,
    RPCMethods.GET_CLIENT,
    RPCMethods.GET_LAST_BLOCK,
    RPCMethods.GET_MEMPOOL,
    RPCMethods.GET_TRANSACTIONS,
    RPCMethods.GET_NODES,
    RPCMethods.MINED_BLOCK_HASH,
    RPCMethods.GET_CONTRACT_SCHEMA
];

export const WRITE_METHODS = [
    RPCMethods.BURN,
    RPCMethods.CREATE_CONTRACT_SCHEMA,
    RPCMethods.CREATE_ACCOUNT,
    RPCMethods.MINE,
    RPCMethods.MINT,
    RPCMethods.TRANSFER
];

export const CONTROL_METHODS = [RPCMethods.START, RPCMethods.STOP, RPCMethods.SHUTDOWN];
