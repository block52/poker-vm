export * from "./types/chain";
export * from "./types/rpc";
export * from "./types/game";
export * from "./client";

export enum KEYS {
    ACTION_TYPE = "actiontype",
    AMOUNT = "amount", // Used for both deposit and withdraw amounts
    DEPOSIT_INDEX = "deposit-index",
    INDEX = "index",
    NONCE = "nonce",
    PUBLIC_KEY = "publickey",
    RECEIVER = "receiver",
    SEAT = "seat",
    SEED = "seed",
    TX_HASH = "txHash",
    VALUE = "value",
    WITHDRAW_NONCE = "withdraw-nonce",
    WITHDRAW_SIGNATURE = "withdraw-signature",
}