import { getInstance } from "../src/core/server"

const start = async () => {
    const _server = getInstance();
    await _server.start();
}