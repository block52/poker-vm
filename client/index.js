// assuming that `inquirer` has already been installed
const inquirer = require("inquirer");

inquirer
  .prompt([
    {
      type: "list",
      name: "prize",
      message: "Select an option",
      choices: [
        "New account",
        "Start a node",
        "List nodes",
        "Join a node",
        "Join a game",
      ],
    },
  ])
  .then((answers) => {
    console.log(JSON.stringify(answers, null, "  "));
  });
