// assuming that `inquirer` has already been installed
const inquirer = require("inquirer");

inquirer
  .prompt([
    {
      type: "list",
      name: "prize",
      message: "Select a prize",
      choices: ["cake", "fries"],
    },
  ])
  .then((answers) => {
    console.log(JSON.stringify(answers, null, "  "));
  });
