# poker-vm

The Layer 2 poker game virtual machine.

## Proxy API

The proxy API is a simple REST API that allows the poker game to interact with the blockchain.

### Get Account

GET `/account/<address>`

Reponse
```json

```

### Get Account Balance

GET `/account/<address>`

```json

```

### Get Account Nonce

GET `/account/<address>`

## Game API

### Get Table

GET `/table/<id>`

```json

```

# SDK

To publish the SDK.

```bash
yarn publish
```

# Node
## Creating the transaction

-   Transactions are sent to the node
-   Node validates the transaction signature
-   Node validates the transaction nonce
-   Node validates the transaction balance, via the account state manager
-   Transaction is added to the transaction mem pool

## Creating the block

-   Nodes are selected in a round robin fashion
-   Transactions are pulled from the mem pool
-   Transactions are replayed in the order they were received, and by the nonce
-   The account state manager is updated with the new balances
-   The block is created and signed by the node
-   The block is sent to the network

## Receiving the block

-   The block is received by another node
-   The block is validated by the node, with validators public key, merkle root, and signature
-   The block is added to the block state manager

## Scripts

### Test accounts

### Tokens and contracts

| Contract | Description                            | Address                                      | Network |
| -------- | -------------------------------------- | -------------------------------------------- | ------- |
| `Token`  | The token used for the poker game      | ``                                           | ``      |
| `Bridge` | The bridge contract for the poker game | `0x0B6052D3951b001E4884eD93a6030f92B1d76cf0` | `base`  |
| `Vault`  | The vault contract for the poker game  | `0x859329813d8e500F4f6Be0fc934E53AC16670fa0` | `base`  |

## Genesis block

Genesis account `0x7f99ad0e59b90eab7e776cefcdae7a920ee1864c`

```json
{
    "index": 0,
    "hash": "24f7acd3b289b5dc7eaf96e9f119fecb7a24a3626c5b26602792d0d1ee8571b7",
    "previousHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "timestamp": 0,
    "validator": "0x7f99aD0e59b90EAB7e776cefcdaE7a920ee1864c",
    "transactions": []
}
```

```json
{
    "address": "0x513d31f0aa9380c5a0f16a996850b9538f74f936",
    "msg": "0x513d31f0aA9380C5A0F16A996850B9538f74F936",
    "sig": "9994fe4ba79f3a919b8b17263575f8362d7c67ca46febfa874699fa210cf87563c042de9b07bdc33c80727eb73e93394c6064c7989ebeb0aca79f4c5276cfd8e1c",
    "version": "3",
    "signer": "MEW"
}
```


## Notes

RANDO https://eth2book.info/capella/part2/building_blocks/randomness/#the-randao