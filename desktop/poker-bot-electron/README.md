# Poker Bot Electron Application

This is an Electron application for the Poker Bot API project, built using TypeScript and Yarn. The application provides a user interface for managing poker bots.

## Project Structure

- **src/**: Contains the source code for the application.
  - **main/**: Contains the main process files.
    - **main.ts**: Main entry point for the Electron application.
    - **preload.ts**: Preload script for exposing APIs to the renderer process.
  - **renderer/**: Contains the renderer process files.
    - **index.html**: HTML template for the user interface.
    - **renderer.ts**: TypeScript code for handling UI logic and interactions.
    - **styles/**: Contains CSS styles for the application.
      - **main.css**: Main stylesheet for the renderer process.
  - **types/**: Contains custom TypeScript types and interfaces.
    - **index.ts**: Exports custom types for the application.

- **dist/**: Directory for the distribution build of the application.

- **package.json**: Configuration file for Yarn, listing dependencies and scripts.

- **tsconfig.json**: TypeScript configuration file specifying compiler options.

- **webpack.config.js**: Webpack configuration file for bundling the application.

- **yarn.lock**: Locks the versions of dependencies installed by Yarn.

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- Yarn package manager

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd poker-bot-electron
   ```

2. Install dependencies:
   ```sh
   yarn install
   ```

### Running the Application

To start the application in development mode, run:
```sh
yarn start
```

### Building the Application

To build the application for distribution, run:
```sh
yarn build
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.