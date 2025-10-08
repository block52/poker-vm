import { ChallengeCommand } from "./challengeCommand";

import { MeCommand } from "./meCommand";
import { RandomCommand } from "./randomCommand";
import { ResponseCommand } from "./responseCommand";
import { GameStateCommand } from "./cosmos/gameStateCommand";
import { GetNodesCommand } from "./getNodesCommand";
import { PerformActionCommand } from "./cosmos/performActionCommand"; // Fixed path
import { PurgeMempoolCommand } from "./purgeMempoolCommand";

// Cosmos commands
import { CosmosAccountCommand } from "./cosmos/cosmosAccountCommand";

// Server control commands
import { SharedSecretCommand } from "./sharedSecretCommand";
import { ISignedResponse } from "./interfaces";

export {
    ChallengeCommand,
    CosmosAccountCommand,
    GameStateCommand,
    GetNodesCommand,
    MeCommand,
    PerformActionCommand,
    PurgeMempoolCommand,
    RandomCommand,
    ResponseCommand,
    SharedSecretCommand
};

// TypeScript's isolatedModules flag requires type-only exports to use 'export type'
// This separates types (which are erased at compile time) from values (which are preserved)
// Classes and values like AccountCommand go in the normal export, while interfaces and type aliases go here
export type { ISignedResponse };
export type { CosmosAccountInfo } from "./cosmos/cosmosAccountCommand";
