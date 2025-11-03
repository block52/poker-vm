import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // CommonJS and ES Modules
  dts: true, // Generate .d.ts files
  sourcemap: true,
  clean: true, // Clean output directory before build
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  external: [
    '@bufbuild/protobuf',
    '@cosmjs/crypto',
    '@cosmjs/encoding',
    '@cosmjs/proto-signing',
    '@cosmjs/stargate',
    '@keplr-wallet/types',
    'axios',
    'ethers',
    'long',
  ],
});

