const server = require("./server");

server.bootstrapNetwork();
const _server = server.getServer();
await _server.validatorLoop();

// while (true) {
//   await _server.validatorLoop();

//   // sleep for 1 second
//   setTimeout(() => {}, 1000);
// }
