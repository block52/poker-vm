#!/usr/bin/env python3
"""
Poker Bot for joining a Texas Hold'em game and polling for legal actions.
"""

import json
import time
import requests
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('PokerBot')


class PlayerActionType(Enum):
    """Player action types from the game"""
    SMALL_BLIND = "small_blind"
    BIG_BLIND = "big_blind"
    FOLD = "fold"
    CHECK = "check"
    BET = "bet"
    CALL = "call"
    RAISE = "raise"
    MUCK = "muck"
    SHOW = "show"
    SIT_OUT = "sit_out"
    SIT_IN = "sit_in"


class NonPlayerActionType(Enum):
    """Non-player action types from the game"""
    JOIN = "join"
    LEAVE = "leave"
    DEAL = "deal"


class PlayerStatus(Enum):
    """Player status from the game"""
    ACTIVE = "active"
    FOLDED = "folded"
    ALL_IN = "all_in"
    SITTING_OUT = "sitting_out"
    NOT_ACTED = "not_acted"
    SHOWING = "showing"


@dataclass
class LegalAction:
    """Represents a legal action a player can take"""
    action: str
    min_amount: str
    max_amount: str
    index: int


@dataclass
class PlayerState:
    """Represents a player's state in the game"""
    address: str
    seat: int
    stack: str
    is_small_blind: bool
    is_big_blind: bool
    is_dealer: bool
    hole_cards: Optional[List[str]]
    status: str
    legal_actions: List[LegalAction]
    sum_of_bets: str
    timeout: int


@dataclass
class GameState:
    """Represents the current game state"""
    address: str
    players: List[PlayerState]
    community_cards: List[str]
    pots: List[str]
    round: str
    next_to_act: int
    dealer: int
    small_blind_position: int
    big_blind_position: int


class PokerBot:
    """
    A bot that joins a poker game and polls for legal actions.
    """

    def __init__(self,
                 rpc_url: str,
                 player_address: str,
                 buy_in_amount: int = 1000000,  # Default 1M chips
                 game_address: str = None):
        """
        Initialize the poker bot.

        Args:
            rpc_url: The RPC endpoint URL for the poker PVM
            player_address: The player's address/ID
            buy_in_amount: Amount of chips to buy in with
            game_address: Specific game address to join (optional)
        """
        self.rpc_url = rpc_url.rstrip('/')
        self.player_address = player_address
        self.buy_in_amount = buy_in_amount
        self.game_address = game_address
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

        logger.info(f"Initialized PokerBot for player {player_address}")
        logger.info(f"RPC URL: {rpc_url}")
        logger.info(f"Buy-in amount: {buy_in_amount}")

    def _make_rpc_call(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make an RPC call to the poker PVM.

        Args:
            method: The RPC method name
            params: Parameters for the RPC call

        Returns:
            The response from the RPC call

        Raises:
            Exception: If the RPC call fails
        """
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
            "id": int(time.time() * 1000)  # Use timestamp as ID
        }

        try:
            logger.debug(f"Making RPC call: {method} with params: {params}")
            response = self.session.post(
                self.rpc_url, json=payload, timeout=30)
            response.raise_for_status()

            result = response.json()

            if "error" in result:
                raise Exception(f"RPC Error: {result['error']}")

            return result.get("result", {})

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during RPC call {method}: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response from RPC call {method}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error during RPC call {method}: {e}")
            raise

    def join_game(self, seat_number: Optional[int] = None) -> bool:
        """
        Join a poker game.

        Args:
            seat_number: Specific seat to join (optional, will find empty seat if None)

        Returns:
            True if successfully joined, False otherwise
        """
        try:
            logger.info(
                f"Attempting to join game with {self.buy_in_amount} chips...")

            # params = {
            #     "player_address": self.player_address,
            #     "action": NonPlayerActionType.JOIN.value,
            #     "amount": str(self.buy_in_amount),
            #     "index": 1  # Initial join action
            # }

            index = 2  # Initial join action
            nonce = 0
            params = [self.player_address, self.game_address, "join", "1000000000000000000", nonce, index, seat_number]

            # if self.game_address:
            #     params["game_address"] = self.game_address

            # if seat_number is not None:
            #     params["seat"] = seat_number

            result = self._make_rpc_call("perform_action", params)

            if result.get("success", False):
                logger.info(
                    f"Successfully joined game at seat {result.get('seat', 'unknown')}")
                return True
            else:
                logger.error(
                    f"Failed to join game: {result.get('message', 'Unknown error')}")
                return False

        except Exception as e:
            logger.error(f"Exception while joining game: {e}")
            return False

    def get_game_state(self) -> Optional[GameState]:
        """
        Get the current game state.

        Returns:
            GameState object if successful, None otherwise
        """
        try:
            # params = {
            #     "caller": self.player_address
            # }

            params = [self.player_address, "0x0000000000000000000000000000000000000000"]

            # if self.game_address:
            #     params["game_address"] = self.game_address

            result = self._make_rpc_call("get_game_state", params)

            if not result:
                logger.warning("Empty response from get_game_state")
                return None

            # Parse players
            players = []
            for player_data in result.get("players", []):
                legal_actions = [
                    LegalAction(
                        action=action["action"],
                        min_amount=action["min"],
                        max_amount=action["max"],
                        index=action["index"]
                    )
                    for action in player_data.get("legalActions", [])
                ]

                player = PlayerState(
                    address=player_data["address"],
                    seat=player_data["seat"],
                    stack=player_data["stack"],
                    is_small_blind=player_data.get("isSmallBlind", False),
                    is_big_blind=player_data.get("isBigBlind", False),
                    is_dealer=player_data.get("isDealer", False),
                    hole_cards=player_data.get("holeCards"),
                    status=player_data["status"],
                    legal_actions=legal_actions,
                    sum_of_bets=player_data.get("sumOfBets", "0"),
                    timeout=player_data.get("timeout", 0)
                )
                players.append(player)

            # Create game state
            game_state = GameState(
                address=result["address"],
                players=players,
                community_cards=result.get("communityCards", []),
                pots=result.get("pots", ["0"]),
                round=result.get("round", "ante"),
                next_to_act=result.get("nextToAct", -1),
                dealer=result.get("dealer", 0),
                small_blind_position=result.get("smallBlindPosition", 1),
                big_blind_position=result.get("bigBlindPosition", 2)
            )

            return game_state

        except Exception as e:
            logger.error(f"Exception while getting game state: {e}")
            return None

    def get_my_player_state(self, game_state: GameState) -> Optional[PlayerState]:
        """
        Get this bot's player state from the game state.

        Args:
            game_state: The current game state

        Returns:
            This bot's PlayerState if found, None otherwise
        """
        for player in game_state.players:
            if player.address.lower() == self.player_address.lower():
                return player
        return None

    def log_game_state(self, game_state: GameState) -> None:
        """
        Log the current game state in a readable format.

        Args:
            game_state: The game state to log
        """
        logger.info("=" * 50)
        logger.info(f"GAME STATE - Round: {game_state.round.upper()}")
        logger.info(f"Community Cards: {game_state.community_cards or 'None'}")
        logger.info(f"Pot: {game_state.pots[0] if game_state.pots else '0'}")
        logger.info(f"Next to Act: Seat {game_state.next_to_act}")
        logger.info("-" * 30)

        for player in game_state.players:
            prefix = ">>> " if player.address.lower() == self.player_address.lower() else "    "
            blind_status = ""
            if player.is_dealer:
                blind_status += " [DEALER]"
            if player.is_small_blind:
                blind_status += " [SB]"
            if player.is_big_blind:
                blind_status += " [BB]"

            logger.info(f"{prefix}Seat {player.seat}: {player.address[:8]}... "
                        f"Stack: {player.stack} Status: {player.status}{blind_status}")

            if player.address.lower() == self.player_address.lower():
                if player.hole_cards and player.hole_cards[0] != "??":
                    logger.info(f"{prefix}Hole Cards: {player.hole_cards}")
                if player.legal_actions:
                    actions_str = ", ".join([f"{action.action}({action.min_amount}-{action.max_amount})"
                                             for action in player.legal_actions])
                    logger.info(f"{prefix}Legal Actions: {actions_str}")

        logger.info("=" * 50)

    def poll_for_legal_actions(self, interval: float = 2.0, max_polls: int = 10) -> List[LegalAction]:
        """
        Poll the game state for legal actions.

        Args:
            interval: Time between polls in seconds
            max_polls: Maximum number of polls before giving up

        Returns:
            List of legal actions available to this bot
        """
        logger.info(
            f"Starting to poll for legal actions (interval: {interval}s, max_polls: {max_polls})")

        for poll_count in range(max_polls):
            logger.info(f"Poll {poll_count + 1}/{max_polls}")

            game_state = self.get_game_state()
            if not game_state:
                logger.warning("Failed to get game state")
                time.sleep(interval)
                continue

            self.log_game_state(game_state)

            my_player = self.get_my_player_state(game_state)
            if not my_player:
                logger.warning("Bot not found in game state")
                time.sleep(interval)
                continue

            if my_player.legal_actions:
                logger.info(
                    f"Found {len(my_player.legal_actions)} legal actions!")
                return my_player.legal_actions

            logger.info("No legal actions available, continuing to poll...")
            time.sleep(interval)

        logger.warning(f"No legal actions found after {max_polls} polls")
        return []

    def run(self) -> None:
        """
        Main bot execution: join game, wait, then poll for legal actions.
        """
        logger.info("Starting Poker Bot...")

        # # Step 1: Join the game
        # seat_number = 2
        # if not self.join_game(seat_number=seat_number):
        #     logger.error("Failed to join game, exiting")
        #     return

        # Step 2: Wait for 5 seconds
        logger.info("Waiting 5 seconds before polling...")
        time.sleep(5)

        # Step 3: Poll for legal actions
        legal_actions = self.poll_for_legal_actions()

        if legal_actions:
            logger.info("Bot successfully found legal actions:")
            for action in legal_actions:
                logger.info(
                    f"  - {action.action}: {action.min_amount} to {action.max_amount}")
        else:
            logger.info("No legal actions found")

        logger.info("Bot execution completed")


def main():
    """
    Example usage of the PokerBot.
    """
    # Configuration - adjust these values for your setup
    RPC_URL = "https://node1.block52.xyz"  # Your poker PVM RPC endpoint
    PLAYER_ADDRESS = "0xC84737526E425D7549eF20998Fa992f88EAC2484"  # Your player address
    BUY_IN_AMOUNT = 1000000  # Chips to buy in with
    GAME_ADDRESS = "0x16374746dc805b9d7e6e7df89a9a601e50fea85d"  # Specific game address, or None for default

    # Create and run the bot
    bot = PokerBot(
        rpc_url=RPC_URL,
        player_address=PLAYER_ADDRESS,
        buy_in_amount=BUY_IN_AMOUNT,
        game_address=GAME_ADDRESS
    )

    try:
        bot.run()
    except KeyboardInterrupt:
        logger.info("Bot interrupted by user")
    except Exception as e:
        logger.error(f"Bot encountered an error: {e}")


if __name__ == "__main__":
    main()
