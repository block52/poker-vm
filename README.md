# poker-vm
Blockchain Poker... again

# Order of operations

## Creating the transaction

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


## Scripts


### Test accounts


### Tokens and contracts

| Contract | Description | Address | Network |
| --- | --- | --- | --- |
| `Token` | The token used for the poker game | `0x75A09716c08c4BB18Ad43F576c7A51CD446E2c36` | `sepolia` |
