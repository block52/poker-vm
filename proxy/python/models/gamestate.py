from pydantic import BaseModel

# Game State DTO
class GameState(BaseModel):
    action: str
    amount: float

    def __init__(self, action: str, amount: float):
        action = action
        amount = amount
