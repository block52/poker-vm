# Fetch

import requests
import json
import random
import time
from table import PokerTable
from typing import Dict, Any
from web3 import Web3
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()


class PokerBot:
    def __init__(self, api_url: str, bot_wallet_id: str):
        """
        Initialize the poker bot with API URL and bot's wallet ID

        Args:
            api_url: Base URL for the poker API
            bot_wallet_id: The wallet ID representing the bot
        """
        self.api_url = api_url
        self.bot_wallet_id = bot_wallet_id
        self.table_id = None
        self.position = None

        self.w3 = Web3()
        seed_phrase = os.getenv('WALLET_SEED')
        if not seed_phrase:
            raise ValueError("No seed phrase found in .env file")

        # self.wallet = self.w3.eth.account.from_key(self.w3.eth.account.from_mnemonic(seed_phrase).key)
        # print(f"Bot wallet address: {self.wallet}")


    def join() -> int:
        # Do call to API to join

        # Set position number
        self.position = 1


    def set_table(self, table_id: str):
        """Set the table ID the bot is playing at"""
        self.table_id = table_id


    def get_table_state(self) -> PokerTable:
        """Get current table state from the API"""
        try:
            response = requests.get(f"{self.api_url}/table/{self.table_id}")
            response.raise_for_status()
            # return response.json()

            table = PokerTable(response.json())
            return table
            

        except requests.exceptions.RequestException as e:
            print(f"Error fetching table state: {e}")
            return None


    def is_bot_turn(self, table_state: Dict[str, Any]) -> bool:
        """
        Check if it's the bot's turn to act

        Returns:
            bool: True if it's bot's turn, False otherwise
        """
        # Find the bot's seat
        bot_player = None
        for player in table_state['players']:
            if player['id'] == self.bot_wallet_id:
                bot_player = player
                break

        if not bot_player:
            return False

        # Check if bot is active and needs to act
        return bot_player['status'] == 'active' and bot_player['action'] == 'check'


    def make_action(self) -> bool:
        """
        Make a random poker action when it's the bot's turn

        Available actions: fold, check, call, raise
        """
        actions = {
            'fold': {'action': 'fold', 'amount': 0},
            'check': {'action': 'check', 'amount': 0},
            'call': {'action': 'call', 'amount': 0},
            'raise': {'action': 'raise', 'amount': random.uniform(2, 10)}
        }

        # Select random action
        action = random.choice(list(actions.keys()))
        action_data = actions[action]

        try:
            response = requests.post(
                f"{self.api_url}/table/{self.table_id}/action",
                json={
                    'playerId': self.bot_wallet_id,
                    'action': action_data['action'],
                    'amount': action_data['amount']
                }
            )
            response.raise_for_status()
            print(f"Made action: {action_data['action']} with amount: {
                  action_data['amount']}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error making action: {e}")
            return False


    def run(self):
        """
        Main bot loop: continuously check table state and act when it's bot's turn
        """
        while True:
            table_state = self.get_table_state()
            print(table_state)

            if table_state:
                if self.is_bot_turn(table_state):
                    # Wait a second before acting
                    time.sleep(1)
                    self.make_action()

            # Wait before checking again to avoid hammering the API
            print("Sleeping")
            time.sleep(0.5)


# Example usage
if __name__ == "__main__":
    API_URL = "https://proxy.block52.xyz"
    BOT_WALLET_ID = "0xa79E6e9eF859956b948d1d310c979f22d6534b29"  # Example wallet ID
    TABLE_ID = "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"

    print("Starting bot for table")

    bot = PokerBot(API_URL, BOT_WALLET_ID)
    bot.set_table(TABLE_ID)
    bot.run()
