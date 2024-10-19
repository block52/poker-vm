#!/bin/bash

# Set the command name
COMMAND_NAME="$(echo "$1" | awk '{print toupper(substr($0, 1, 1)) tolower(substr($0, 2))}')"

cd src/commands

# Create the command file with interface implemented
COMMAND_FILE="$(echo "$1" | tr '[:upper:]' '[:lower:]').ts"
cat <<EOL > "$COMMAND_FILE"
import { ICommand } from "./interfaces";

class ${COMMAND_NAME} implements ICommand<T> {
  execute() {
    // TODO: Implement the ${COMMAND_NAME} command logic here
    console.log("Executing ${COMMAND_NAME} command...");
  }
}

export default ${COMMAND_NAME};
EOL

# Create the test file
TEST_FILE="$(echo "$1" | tr '[:upper:]' '[:lower:]').test.ts"
cat <<EOL > "$TEST_FILE"
import ${COMMAND_NAME} from "./$(echo "$1" | tr '[:upper:]' '[:lower:]')";

describe("${COMMAND_NAME} Command", () => {
  it("should execute without errors", () => {
    const command = new ${COMMAND_NAME}();
    command.execute();
    // TODO: Add assertions to verify the command behavior
  });
});
EOL

# Output the created files
echo "Created files:"
echo "- $COMMAND_FILE"
echo "- $TEST_FILE"