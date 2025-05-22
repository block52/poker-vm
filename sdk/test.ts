import { PlayerActionType } from "./dist/types/game";
import { NodeRpcClient } from "./src/client";

// import .env
import { config } from "dotenv";
config();

const PLAYER_1_PRIVATE_KEY = process.env.PLAYER_1_PRIVATE_KEY;
const PLAYER_2_PRIVATE_KEY = process.env.PLAYER_2_PRIVATE_KEY;

const client1 = new NodeRpcClient("http://localhost:3000", PLAYER_1_PRIVATE_KEY || "");
const client2 = new NodeRpcClient("http://localhost:3000", PLAYER_2_PRIVATE_KEY || "");


async function main() {
  const result1 = await client1.playerJoin("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", 1000000000000000000n, 1);
  const result2 = await client2.playerJoin("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", 1000000000000000000n, 2);
  console.log(result1);
  console.log(result2);

  const sbResult = await client1.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.SMALL_BLIND, "10000000000000000");
  console.log(sbResult);

  const bbResult = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.BIG_BLIND, "20000000000000000");
  console.log(bbResult);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});