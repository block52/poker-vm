from pydantic import BaseModel
# from web3 import Web3

# w3 = Web3()


# Account Model
class Account(BaseModel):
    account: str
    balance: float

    def __init__(self, account: str):
        self.account = account
        # self.balance = self.get_balance()
