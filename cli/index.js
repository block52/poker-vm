// assuming that `inquirer` has already been installed
const inquirer = require("inquirer");
const RPCRequest = require("@bitcoinbrisbane/block52");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

let pk = process.env.PK || "";

const questions = [
  {
    type: "list",
    name: "action",
    message: "What do you want to do?",
    choices: ["Create an account", "Import private key", "Join a game", "Exit / Quit"],
  },
];

const createPrivateKey = async () => {
  const geekA = crypto.createECDH('secp521r1'); 
  geekA.generateKeys(); 
  const key = geekA.getPrivateKey('base64'); 
  console.log(key);
  return "";
}

const ask = async () => {
  let response = null;
  while (response !== "exit") {
    const prompt = inquirer.createPromptModule();
    const answers = await prompt(questions);

    switch (answers.action) {
      case "Create an account":
        await createPrivateKey();
        break;
      case "Import private key":

        break;
      case "Join a game":

        break;
      case "Exit / Quit":
        break;
      default:
        console.log("Invalid action");
        break
    }

    // console.log(JSON.stringify(answers, null, "  "));
    console.log("answers.action", answers.action);
    response = answers.action;
  }
};

ask();
