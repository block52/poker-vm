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

// const P1 = TABLE_ID;
// const P2 = "0xC84737526E425D7549eF20998Fa992f88EAC2484";

const TABLE_ID = "0x2314eac2fcb3943e41ad8b1fb46a188eef201452";
// 0xccd6e31012fd0ade9beb377c2f20661b832abfe7

async function main() {
    let result2 = await client2.playerJoin(TABLE_ID, 1000000000000000000000n, 2);
    let result1 = await client1.playerJoin(TABLE_ID, 1000000000000000000000n, 1);
    // let result2 = await client2.playerJoin(TABLE_ID, 1000000000000000000000n, 2);
    // console.log(result1);
    // console.log(result2);

    const sbResult = await client2.playerAction(TABLE_ID, PlayerActionType.SMALL_BLIND, "10000000000000000");
    console.log(sbResult);

    const bbResult = await client1.playerAction(TABLE_ID, PlayerActionType.BIG_BLIND, "20000000000000000");
    console.log(bbResult);

    // deal
    const dealResult = await client1.deal(TABLE_ID, "2415244220693136377713921289748740858699681395268293", "0xC84737526E425D7549eF20998Fa992f88EAC2484");
    console.log(dealResult);

    // p1 call
    const callResult = await client2.playerAction(TABLE_ID, PlayerActionType.CALL, "10000000000000000");
    console.log(callResult);

    // p2 check
    const checkResult = await client1.playerAction(TABLE_ID, PlayerActionType.CHECK, "0");
    console.log(checkResult);

    // flop
    // p1 check
    const checkResult2 = await client2.playerAction(TABLE_ID, PlayerActionType.CHECK, "0");

    // p2 check
    const checkResult3 = await client1.playerAction(TABLE_ID, PlayerActionType.CHECK, "0");

    // turn
    // p1 check
    const checkResult4 = await client2.playerAction(TABLE_ID, PlayerActionType.CHECK, "0");
    // p2 check
    const checkResult5 = await client1.playerAction(TABLE_ID, PlayerActionType.CHECK, "0");

    // river
    // p1 check
    const checkResult6 = await client2.playerAction(TABLE_ID, PlayerActionType.CHECK, "0");
    // p2 check
    const checkResult7 = await client1.playerAction(TABLE_ID, PlayerActionType.CHECK, "0");

    // showdown
    // p1 show
    const showResult = await client2.playerAction(TABLE_ID, PlayerActionType.SHOW, "0xC84737526E425D7549eF20998Fa992f88EAC2484");
    console.log(showResult);

    // p2 show
    const showResult2 = await client1.playerAction(TABLE_ID, PlayerActionType.SHOW, TABLE_ID);
    console.log(showResult2);

    // new hand
    const newHandResult = await client2.newHand(TABLE_ID);
    console.log(newHandResult);

    // now repost small blind (p2 now sb)
    const sbResult2 = await client2.playerAction(TABLE_ID, PlayerActionType.SMALL_BLIND, "10000000000000000");
    console.log(sbResult2);
}

main().catch(error => {
    console.error("Error:", error);
    process.exit(1);
});
