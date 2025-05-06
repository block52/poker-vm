import { AccountCommand } from "./accountCommand";
import { BalanceCommand } from "./balanceCommand";
import { ChallengeCommand } from "./challengeCommand";
import { GetTransactionsCommand } from "./getTransactionsCommand";
import { MeCommand } from "./meCommand";
import { MintCommand } from "./mintCommand";
import { NewCommand } from "./newCommand";
import { RandomCommand } from "./randomCommand";
import { ResponseCommand } from "./responseCommand";
import { TransferCommand } from "./transferCommand";
import { DeployContractCommand } from "./deployContractCommand";
import { ResetCommand } from "./resetCommand";

import { BlockCommand, BlockCommandParams } from "./blockCommand";
import { BurnCommand } from "./burnCommand";
import { CreateAccountCommand } from "./createAccountCommand";
import { CreateContractSchemaCommand } from "./contractSchema/createContractSchemaCommand";
import { GameStateCommand } from "./gameStateCommand";
import { GetAllContractSchemasCommand } from "./contractSchema/getAllContractSchemasCommand";
import { GetBlocksCommand } from "./getBlocksCommand";
import { GetContractSchemaCommand } from "./contractSchema/getContractSchemaCommand";
import { GetNodesCommand } from "./getNodesCommand";
import { GetTransactionCommand } from "./getTransactionCommand";
import { MempoolCommand } from "./mempoolCommand";
import { MineCommand } from "./mineCommand";
import { PerformActionCommand } from "./performActionCommand";
import { PurgeMempoolCommand } from "./purgeMempoolCommand";
import { ReceiveMinedBlockCommand } from "./receiveMinedBlockCommand";
import { ReceiveMinedBlockHashCommand } from "./receiveMinedBlockHashCommand";
import { SharedSecretCommand } from "./sharedSecretCommand";
import { ShutdownCommand } from "./shutdownCommand";
import { StartServerCommand } from "./startServerCommand";
import { StopServerCommand } from "./stopServerCommand";
import { ISignedResponse } from "./interfaces";

export {
    AccountCommand,
    BalanceCommand,
    ChallengeCommand,
    GetTransactionsCommand,
    DeployContractCommand,
    MeCommand,
    MintCommand,
    NewCommand,
    RandomCommand,
    ResponseCommand,
    TransferCommand,
    BlockCommand,
    BurnCommand,
    CreateAccountCommand,
    CreateContractSchemaCommand,
    GameStateCommand,
    GetAllContractSchemasCommand,
    GetContractSchemaCommand,
    GetBlocksCommand,
    GetNodesCommand,
    GetTransactionCommand,
    MempoolCommand,
    MineCommand,
    PerformActionCommand,
    PurgeMempoolCommand,
    ResetCommand,
    ReceiveMinedBlockCommand,
    ReceiveMinedBlockHashCommand,
    SharedSecretCommand,
    ShutdownCommand,
    StartServerCommand,
    StopServerCommand,
};

// TypeScript's isolatedModules flag requires type-only exports to use 'export type'
// This separates types (which are erased at compile time) from values (which are preserved)
// Classes and values like AccountCommand go in the normal export, while interfaces and type aliases go here
export type {
    BlockCommandParams,
    ISignedResponse
};
