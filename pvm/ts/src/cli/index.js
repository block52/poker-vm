// assuming that `inquirer` has already been installed
const inquirer = require("inquirer");

const client = require("../../dist/client/client");

const questions = [
  {
    type: "list",
    name: "action",
    message: "What do you want to do?",
    choices: ["New account", "List contracts / games", "Join a game", "exit"],
  },
];

const ask = async () => {
  let response = null;
  while (response !== "exit") {
    const prompt = inquirer.createPromptModule();
    const answers = await prompt(questions);

    switch (answers.action) {
      case "New account":
        client.getNodes();
        break;
      case "List contracts / games":
        client.getNodes();
        break;
      case "Join a game":
        client.getNodes();
        break;
      case "exit":
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
