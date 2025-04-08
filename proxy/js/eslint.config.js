module.exports = [
  {
    rules: {
      // Only enforce double quotes rule, nothing else
      "quotes": ["error", "double"]
    },
    // Ignore node_modules and any other directories you want to skip
    ignores: ["node_modules/**", "dist/**"]
  }
]; 