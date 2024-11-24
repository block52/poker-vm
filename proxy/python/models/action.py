from pydantic import BaseModel

# Action DTO
class Action(BaseModel):
    action: str
    amount: float

    def __init__(self, action: str, amount: float):
        action = action
        amount = amount
