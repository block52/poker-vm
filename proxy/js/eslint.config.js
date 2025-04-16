const jsPlugin = require("@eslint/js");
const globals = require("globals");

module.exports = [
  // Include the recommended rules directly
  jsPlugin.configs.recommended,
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    plugins: { js: jsPlugin }
  },
  // Set proper globals for all files to recognize CommonJS patterns
  { 
    files: ["**/*.{js,cjs}"], 
    languageOptions: { 
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        require: "readonly",
        module: "writable",
        process: "readonly",
        global: "readonly",
        NodeRpcClient: "writable",
        WebSocket: "writable",
        clientInstance: "writable",
        canProceed: "writable",
        wallet: "writable",
        depositContract: "writable",
        mongoose: "readonly"
      }
    }
  },
  { files: ["**/*.mjs"], languageOptions: { sourceType: "module" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      // Enforce double quotes
      "quotes": ["error", "double"],
      // Error on unused variables and imports - this will catch unused modules
      "no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false }]
    }
  }
];