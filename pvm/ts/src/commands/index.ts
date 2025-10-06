import { AccountCommand } from "./accountCommand";
import { BalanceCommand } from "./balanceCommand";
import { ChallengeCommand } from "./challengeCommand";
import { GetTransactionsCommand } from "./getTransactionsCommand";
import { MeCommand } from "./meCommand";
import { MintCommand } from "./mintCommand";
import { NewCommand } from "./newCommand";
import { NewTableCommand } from "./newTableCommand";
import { RandomCommand } from "./randomCommand";
import { ResponseCommand } from "./responseCommand";
import { TransferCommand } from "./transferCommand";
import { DeployContractCommand } from "./deployContractCommand";

import { BlockCommand, BlockCommandParams } from "./blockCommand";
import { BurnCommand } from "./burnCommand";
import { CreateAccountCommand } from "./createAccountCommand";
import { FindGameStateCommand } from "./findGameCommand";
import { GameStateCommand } from "./comsos/gameStateCommand";
import { GetBlocksCommand } from "./getBlocksCommand";
import { GetCosmosBlocksCommand } from "./getCosmosBlocksCommand";
import { GetNodesCommand } from "./getNodesCommand";
import { GetTransactionCommand } from "./getTransactionCommand";
import { MempoolCommand } from "./mempoolCommand";
import { MineCommand } from "./mineCommand";
import { PerformActionCommand } from "./performActionCommand";
import { PerformActionCommandWithResult } from "./performActionCommandWithResult";
import { PurgeMempoolCommand } from "./purgeMempoolCommand";
import { ReceiveMinedBlockCommand } from "./receiveMinedBlockCommand";
import { ReceiveMinedBlockHashCommand } from "./receiveMinedBlockHashCommand";

// Cosmos commands
import { CosmosAccountCommand } from "./cosmos/cosmosAccountCommand";

// Server control commands
import { SharedSecretCommand } from "./sharedSecretCommand";
import { ShutdownCommand } from "./shutdownCommand";
import { StartServerCommand } from "./startServerCommand";
import { StopServerCommand } from "./stopServerCommand";
import { WithdrawCommand } from "./withdrawCommand";
import { ISignedResponse } from "./interfaces";

export {
    AccountCommand,
    BalanceCommand,
    BlockCommand,
    BurnCommand,
    ChallengeCommand,
    CosmosAccountCommand,
    CreateAccountCommand,
    DeployContractCommand,
    FindGameStateCommand,
    GameStateCommand,
    GetBlocksCommand,
    GetCosmosBlocksCommand,
    GetNodesCommand,
    GetTransactionCommand,
    GetTransactionsCommand,
    MeCommand,
    MempoolCommand,
    MineCommand,
    MintCommand,
    NewCommand,
    NewTableCommand,
    PerformActionCommand,
    PerformActionCommandWithResult,
    PurgeMempoolCommand,
    RandomCommand,
    ReceiveMinedBlockCommand,
    ReceiveMinedBlockHashCommand,
    ResponseCommand,
    SharedSecretCommand,
    ShutdownCommand,
    StartServerCommand,
    StopServerCommand,
    TransferCommand,
    WithdrawCommand
};

// TypeScript's isolatedModules flag requires type-only exports to use 'export type'
// This separates types (which are erased at compile time) from values (which are preserved)
// Classes and values like AccountCommand go in the normal export, while interfaces and type aliases go here
export type { BlockCommandParams, ISignedResponse };
export type { CosmosAccountInfo } from "./cosmos/cosmosAccountCommand";
