
```bash
yarn start
```

# PVM work flow

* Transactions are sent to the node
* Node validates the transaction signature
* Node validates the transaction nonce
* Node validates the transaction balance, via the account state manager
* Transaction is added to the transaction mem pool

## Creating the block

* Nodes are selected in a round robin fashion
* Transactions are pulled from the mem pool
* Transactions are replayed in the order they were received, and by the nonce
* The account state manager is updated with the new balances
* The block is created and signed by the node
* The block is sent to the network

## Receiving the block

* The block is received by another node
* The block is validated by the node, with validators public key, merkle root, and signature
* The block is added to the block state manager

## Account State Manager


## Test accounts

Test accounts are generated from the seed phrase in the .env file.

#0 0xe05Af8f0689F0BcB7A90FA97B877b4CD14373e5F
#1 0x5D2576A315F7c9e66E5803952bbE2bbe96A53C73

### .env Example

```text
PORT=3000
SEED=east monitor scheme fee right allow film what render stereo practice miss
```

## RPC Commands

The following are the RPC commands that can be sent to the node.

General format:

```json
{
    "method": "methodName",
    "params": [],
    "id": 1,
    "jsonrpc": "2.0",
    "data": "",
    "signature": "TEST"
}
```

### Mint

For testing purposes, we can mint tokens to an account.

```json
{
    "method": "mint",
    "params": ["0xe05Af8f0689F0BcB7A90FA97B877b4CD14373e5F", 100],
    "id": 1,
    "jsonrpc": "2.0"
}
```


### Transfer

Sends tokens on the layer 2 network.

```json
{
    "method": "transfer",
    "params": ["0xe05Af8f0689F0BcB7A90FA97B877b4CD14373e5F", 100],
    "id": 1,
    "jsonrpc": "2.0"
}
```

### Balance

```json
{
    "method": "getAccount",
    "params": ["0xe05Af8f0689F0BcB7A90FA97B877b4CD14373e5F"],
    "id": 1,
    "jsonrpc": "2.0"
}
```

### Join

To join the game, the player must transfer the minimum amount of tokens to the contract.

```json
{
    "method": "join",
    "params": [100],
    "id": 1,
    "jsonrpc": "2.0"
}
```

### Exit

```json
{

}
```


## Run an end to end test

Using curl to hit our node.   This can be found in the `/scripts` directory.

```bash
./scripts/e2e.sh
```

* Mint 100 tokens to the first account
* Transfer 50 tokens from the first account to the second account
* Exit the second account
