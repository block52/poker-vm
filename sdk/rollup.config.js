import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: true
            }
        ],
        plugins: [
            json(),
            resolve({
                browser: true,
                preferBuiltins: false
            }),
            commonjs(),
            typescript({
                tsconfig: "./tsconfig.json",
                declaration: true,
                declarationDir: "./dist"
            })
        ],
        external: [
            "@cosmjs/stargate",
            "@cosmjs/proto-signing",
            "@cosmjs/crypto",
            "@cosmjs/encoding",
            "@cosmjs/amino",
            "@cosmjs/math",
            "@cosmjs/utils",
            "@cosmjs/tendermint-rpc",
            "@noble/hashes",
            "@noble/hashes/sha2",
            "@noble/hashes/legacy",
            "@noble/curves",
            "@noble/curves/ed25519",
            "@noble/curves/ed25519.js",
            "ethers",
            "crypto",
            "events",
            "stream",
            "buffer",
            "util",
            "process"
        ]
    },
    {
        input: "src/index.ts",
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        plugins: [dts()]
    }
];
