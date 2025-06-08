import js from "@eslint/js"

export default [
  {
    ignores: ["dist"]
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    rules: {
      "quotes": ["error", "double"]
    }
  }
]
