import { NonPlayerActionType } from "./dist/types/game";
import { PlayerActionType } from "./dist/types/game";
import { NodeRpcClient } from "./src/client";

// import .env
import { config } from "dotenv";
config();

const PLAYER_1_PRIVATE_KEY = process.env.PLAYER_1_PRIVATE_KEY;
const PLAYER_2_PRIVATE_KEY = process.env.PLAYER_2_PRIVATE_KEY;

const client1 = new NodeRpcClient("http://localhost:3000", PLAYER_1_PRIVATE_KEY || "");
const client2 = new NodeRpcClient("http://localhost:3000", PLAYER_2_PRIVATE_KEY || "");

// const P1 = "0xccd6e31012fd0ade9beb377c2f20661b832abfe7";
// const P2 = "0xC84737526E425D7549eF20998Fa992f88EAC2484";

async function main() {
  let result1 = await client1.playerJoin("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", 1000000000000000000n, 1);
  let result2 = await client2.playerJoin("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", 1000000000000000000n, 2);
  console.log(result1);
  console.log(result2);

  const sbResult = await client1.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.SMALL_BLIND, "10000000000000000");
  console.log(sbResult);

  const bbResult = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.BIG_BLIND, "20000000000000000");
  console.log(bbResult);

  // deal
  const dealResult = await client1.deal("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "2415244220693136377713921289748740858699681395268293", "0xC84737526E425D7549eF20998Fa992f88EAC2484");
  console.log(dealResult);

  // p1 call
  const callResult = await client1.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CALL, "10000000000000000");
  console.log(callResult);

  // p2 check
  const checkResult = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CHECK, "0");
  console.log(checkResult);

  // flop
  // p1 check
  const checkResult2 = await client1.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CHECK, "0");

  // p2 check
  const checkResult3 = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CHECK, "0");

  // turn
  // p1 check
  const checkResult4 = await client1.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CHECK, "0");
  // p2 check
  const checkResult5 = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CHECK, "0");

  // river
  // p1 check
  const checkResult6 = await client1.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CHECK, "0");
  // p2 check
  const checkResult7 = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.CHECK, "0");

  // showdown
  // p1 show
  const showResult = await client1.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.SHOW, "0xC84737526E425D7549eF20998Fa992f88EAC2484");
  console.log(showResult);

  // p2 show
  const showResult2 = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.SHOW, "0xccd6e31012fd0ade9beb377c2f20661b832abfe7");
  console.log(showResult2);

  // new hand
  const newHandResult = await client1.newHand("0xccd6e31012fd0ade9beb377c2f20661b832abfe7");
  console.log(newHandResult);

  // now repost small blind
  const sbResult2 = await client2.playerAction("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", PlayerActionType.SMALL_BLIND, "10000000000000000");
  console.log(sbResult2);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});