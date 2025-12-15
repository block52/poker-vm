import { RPCMethods } from "@block52/poker-vm-sdk";

// RESET_BLOCKCHAIN is now included in the SDK's RPCMethods enum, so we don't need a custom constant

export const READ_METHODS = [
    RPCMethods.FIND_CONTRACT,
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
    RPCMethods.DEPLOY_CONTRACT,
    RPCMethods.MINE,
    RPCMethods.MINED_BLOCK_HASH,
    RPCMethods.MINT,
    RPCMethods.NEW_HAND,
    RPCMethods.NEW_TABLE,
    RPCMethods.PERFORM_ACTION,
    RPCMethods.TRANSFER,
    RPCMethods.WITHDRAW
];

export const CONTROL_METHODS = [
    RPCMethods.PURGE,
    RPCMethods.RESET_BLOCKCHAIN,
    RPCMethods.START,
    RPCMethods.STOP,
    RPCMethods.SHUTDOWN
];
