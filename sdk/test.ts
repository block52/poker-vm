import { NodeRpcClient } from "./src/client";

const PLAYER_1_PRIVATE_KEY = "0x04e12a56ef8a7f95d16faefdb7211a4625051538a951514909898a2ea2ede36a";
const client = new NodeRpcClient("http://localhost:3000", PLAYER_1_PRIVATE_KEY);

async function main() {
  const result = await client.newHand("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "", 0);
  console.log(result);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});