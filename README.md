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
| `Token` | The token used for the poker game | `0xe7d69c2351cdb850D5DB9e4eCd9C7a1059Db806a` | `sepolia` |
| `Vault` | The vault contract for the poker game | `0x36c347E374Bf272AdD3B0FDfA5821795eBC0Fc9d` | `sepolia` |
| `Bridge` | The bridge contract for the poker game | `` | `sepolia` |


```text
{
  "address": "0x513d31f0aa9380c5a0f16a996850b9538f74f936",
  "msg": "0x513d31f0aA9380C5A0F16A996850B9538f74F936",
  "sig": "9994fe4ba79f3a919b8b17263575f8362d7c67ca46febfa874699fa210cf87563c042de9b07bdc33c80727eb73e93394c6064c7989ebeb0aca79f4c5276cfd8e1c",
  "version": "3",
  "signer": "MEW"
}
```
