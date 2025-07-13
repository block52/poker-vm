#!/bin/bash 
# https://docs.cosmos.network/main/user/run-node/run-node

cd build
./simd keys add my_validator --keyring-backend test

./simd init shocking --chain-id my-test-chain
./simd genesis add-genesis-account cosmos1z5wg4fpqjvmzg7na4v72chvgskdmlunfn80hj2 1000000000000000000stake
./simd genesis gentx shocking 100000000stake --chain-id my-test-chain --keyring-backend test