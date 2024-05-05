const PORT = process.env.PORT || 3001;

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    return new Response("PVM running");
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);
