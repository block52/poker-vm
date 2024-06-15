const server = require("./server");

const _server = server.getServer();
_server.validatorLoop();

// while (true) {
//   await _server.validatorLoop();

//   // sleep for 1 second
//   setTimeout(() => {}, 1000);
// }
