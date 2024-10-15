import { getServer } from "./server";
// const _server = server.getServer();
// _server.validatorLoop();

// while (true) {
//   await _server.validatorLoop();

//   // sleep for 1 second
//   setTimeout(() => {}, 1000);
// }

const start = async () => {
  const server = getServer();
  server.bootstrapNetwork();
  await server.validatorLoop();
};

console.log("Starting PVM ...");
start();
