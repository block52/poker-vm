
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
from decimal import Decimal
from web3 import Web3
from web3.types import Wei

class Round(Enum):
    PREFLOP = "PREFLOP"
    FLOP = "FLOP"
    TURN = "TURN"
    RIVER = "RIVER"


@dataclass
class Player:
    address: str
    seat: int
    stack: str  # Wei value as string
    bet: str    # Wei value as string
    cards: List[str]
    status: str
    action: Optional[str] = None

    @property
    def stack_ether(self) -> Decimal:
        """Convert stack from Wei to Ether"""
        return Decimal(Web3.from_wei(int(self.stack), 'ether'))


    @property
    def bet_ether(self) -> Decimal:
        """Convert bet from Wei to Ether"""
        return Decimal(Web3.from_wei(int(self.bet), 'ether'))


class PokerTable:
    def __init__(self, table_data: dict):
        self.type = table_data['type']
        self.address = table_data['address']
        self.small_blind = table_data['smallBlind']  # Wei value as string
        self.big_blind = table_data['bigBlind']      # Wei value as string
        self.dealer = table_data['dealer']
        self.players: List[Player] = []
        self.community_cards = table_data['communityCards']
        self.pots = table_data['pots']               # List of Wei values as strings
        self.next_to_act = table_data['nextToAct']
        self.round = Round(table_data['round'])
        self.winners = table_data['winners']
        self.signature = table_data['signature']

        # Convert player data if present
        if table_data['players']:
            for player_data in table_data['players']:
                player = Player(
                    address=player_data['address'],
                    seat=player_data['seat'],
                    stack=player_data['stack'],
                    bet=player_data['bet'],
                    cards=player_data.get('cards', []),
                    status=player_data['status'],
                    action=player_data.get('action')
                )
                self.players.append(player)

    @property
    def small_blind_ether(self) -> Decimal:
        """Convert small blind from Wei to Ether"""
        # Convert to Wei first then to Ether
        wei_value = Web3.to_wei(self.small_blind, 'ether')
        eth_value = Web3.from_wei(wei_value, 'ether')
        return Decimal(str(eth_value))

    @property
    def big_blind_ether(self) -> Decimal:
        """Convert big blind from Wei to Ether"""
        ## return Decimal(Web3.from_wei(int(self.big_blind), 'ether'))
        return self.to_decimal(self.big_blind)

    @property
    def pots_ether(self) -> List[Decimal]:
        """Convert pots from Wei to Ether"""
        # return [Decimal(Web3.from_wei(int(pot), 'ether')) for pot in self.pots]
        return [self.to_decimal(pot) for pot in self.pots]


    def to_decimal(self, value: str) -> Decimal:
        wei_value = Web3.to_wei(value, 'ether')
        eth_value = Web3.from_wei(wei_value, 'ether')
        return Decimal(str(eth_value))
    

    def get_player_by_seat(self, seat: int) -> Optional[Player]:
        """Get player by seat number"""
        for player in self.players:
            if player.seat == seat:
                return player
        return None

    def get_player_by_address(self, address: str) -> Optional[Player]:
        """Get player by ethereum address"""
        address = address.lower()
        for player in self.players:
            if player.address.lower() == address:
                return player
        return None

    def total_pot_ether(self) -> Decimal:
        """Calculate total pot size in Ether"""
        return sum(self.pots_ether)

    def active_players(self) -> List[Player]:
        """Get list of active players"""
        return [player for player in self.players if player.status == 'active']

    def is_player_turn(self, address: str) -> bool:
        """Check if it's a specific player's turn"""
        player = self.get_player_by_address(address)
        if not player:
            return False
        return player.seat == self.next_to_act

    def __str__(self) -> str:
        return (
            f"Poker Table ({self.type})\n"
            f"Round: {self.round.value}\n"
            f"Blinds: {self.small_blind_ether}/{self.big_blind_ether} ETH\n"
            f"Total Pot: {self.total_pot_ether()} ETH\n"
            f"Players: {len(self.players)}\n"
            f"Community Cards: {', '.join(self.community_cards)}\n"
            f"Next to Act: Seat {self.next_to_act}"
        )
