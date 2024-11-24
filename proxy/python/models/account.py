from pydantic import BaseModel

# Account Model
class Account(BaseModel):
    account: str
    balance: float

    def __init__(self, account: str, balance: float):
        self.account = account
        self.balance = balance
