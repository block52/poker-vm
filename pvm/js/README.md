
```bash
yarn express
```

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
