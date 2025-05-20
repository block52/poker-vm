import { ethers } from "ethers";
import { NodeRpcClient } from "./src/client";

const client = new NodeRpcClient("http://localhost:3000", "");

async function main() {
  const result = await client.newHand("0xccd6e31012fd0ade9beb377c2f20661b832abfe7", "", 0);
  console.log(result);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});