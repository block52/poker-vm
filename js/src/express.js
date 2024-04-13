const express = require("express");

const app = express();
const cors = require("cors");
const rpc = require("./vm/rpc");

app.use(cors());
app.use(express.json());

app.use("/rpc", rpc);

app.listen(3000, () => {
  console.log("PVM server running on port 3000");
});
