package engine

import (
	"math/big"
	"testing"

	"github.com/block52/poker-vm/pvm/go/types"
)

func TestNewTexasHoldemGame(t *testing.T) {
	options := types.GameOptions{
		MinBuyIn:   big.NewInt(100),
		MaxBuyIn:   big.NewInt(1000),
		MinPlayers: 2,
		MaxPlayers: 9,
		SmallBlind: big.NewInt(5),
		BigBlind:   big.NewInt(10),
		Type:       types.CashGame,
	}
	
	game := NewTexasHoldemGame("0x123", options)
	
	if game == nil {
		t.Fatal("Expected game to be created")
	}
	
	if game.address != "0x123" {
		t.Errorf("Expected address 0x123, got %s", game.address)
	}
	
	if game.GetPlayerCount() != 0 {
		t.Errorf("Expected 0 players, got %d", game.GetPlayerCount())
	}
}

func TestAddPlayer(t *testing.T) {
	options := types.GameOptions{
		MinBuyIn:   big.NewInt(100),
		MaxBuyIn:   big.NewInt(1000),
		MinPlayers: 2,
		MaxPlayers: 9,
		SmallBlind: big.NewInt(5),
		BigBlind:   big.NewInt(10),
		Type:       types.CashGame,
	}
	
	game := NewTexasHoldemGame("0x123", options)
	
	// Test valid player addition
	err := game.AddPlayer("0xPlayer1", 0, big.NewInt(500))
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	
	if game.GetPlayerCount() != 1 {
		t.Errorf("Expected 1 player, got %d", game.GetPlayerCount())
	}
	
	// Test duplicate seat
	err = game.AddPlayer("0xPlayer2", 0, big.NewInt(500))
	if err != types.ErrSeatOccupied {
		t.Errorf("Expected ErrSeatOccupied, got %v", err)
	}
	
	// Test buy-in too low
	err = game.AddPlayer("0xPlayer3", 1, big.NewInt(50))
	if err != types.ErrInsufficientChips {
		t.Errorf("Expected ErrInsufficientChips, got %v", err)
	}
	
	// Test buy-in too high
	err = game.AddPlayer("0xPlayer4", 2, big.NewInt(2000))
	if err != types.ErrInvalidBetAmount {
		t.Errorf("Expected ErrInvalidBetAmount, got %v", err)
	}
}

func TestCanStart(t *testing.T) {
	options := types.GameOptions{
		MinBuyIn:   big.NewInt(100),
		MaxBuyIn:   big.NewInt(1000),
		MinPlayers: 2,
		MaxPlayers: 9,
		SmallBlind: big.NewInt(5),
		BigBlind:   big.NewInt(10),
		Type:       types.CashGame,
	}
	
	game := NewTexasHoldemGame("0x123", options)
	
	// Not enough players
	if game.CanStart() {
		t.Error("Expected game not to start with 0 players")
	}
	
	// Add one player
	game.AddPlayer("0xPlayer1", 0, big.NewInt(500))
	if game.CanStart() {
		t.Error("Expected game not to start with 1 player")
	}
	
	// Add second player
	game.AddPlayer("0xPlayer2", 1, big.NewInt(500))
	if !game.CanStart() {
		t.Error("Expected game to start with 2 players")
	}
}

func TestStartHand(t *testing.T) {
	options := types.GameOptions{
		MinBuyIn:   big.NewInt(100),
		MaxBuyIn:   big.NewInt(1000),
		MinPlayers: 2,
		MaxPlayers: 9,
		SmallBlind: big.NewInt(5),
		BigBlind:   big.NewInt(10),
		Type:       types.CashGame,
	}
	
	game := NewTexasHoldemGame("0x123", options)
	game.AddPlayer("0xPlayer1", 0, big.NewInt(500))
	game.AddPlayer("0xPlayer2", 1, big.NewInt(500))
	
	err := game.StartHand()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	
	// Check hand started
	if game.handNumber != 1 {
		t.Errorf("Expected hand number 1, got %d", game.handNumber)
	}
	
	// Check blinds posted
	if game.pots[0].Cmp(big.NewInt(15)) != 0 {
		t.Errorf("Expected pot of 15, got %s", game.pots[0].String())
	}
	
	// Check hole cards dealt
	for _, player := range game.players {
		if len(player.HoleCards) != 2 {
			t.Errorf("Expected 2 hole cards, got %d", len(player.HoleCards))
		}
	}
}

func TestPerformAction(t *testing.T) {
	options := types.GameOptions{
		MinBuyIn:   big.NewInt(100),
		MaxBuyIn:   big.NewInt(1000),
		MinPlayers: 2,
		MaxPlayers: 9,
		SmallBlind: big.NewInt(5),
		BigBlind:   big.NewInt(10),
		Type:       types.CashGame,
	}
	
	game := NewTexasHoldemGame("0x123", options)
	game.AddPlayer("0xPlayer1", 0, big.NewInt(500))
	game.AddPlayer("0xPlayer2", 1, big.NewInt(500))
	game.StartHand()
	
	nextPlayer := game.GetNextPlayerToAct()
	if nextPlayer == nil {
		t.Fatal("Expected next player to act")
	}
	
	// Test valid action
	err := game.PerformAction(nextPlayer.Address, types.Check, big.NewInt(0))
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	
	// Test action out of turn
	err = game.PerformAction(nextPlayer.Address, types.Check, big.NewInt(0))
	if err != types.ErrActionOutOfTurn {
		t.Errorf("Expected ErrActionOutOfTurn, got %v", err)
	}
}

func TestGetActivePlayers(t *testing.T) {
	options := types.GameOptions{
		MinBuyIn:   big.NewInt(100),
		MaxBuyIn:   big.NewInt(1000),
		MinPlayers: 2,
		MaxPlayers: 9,
		SmallBlind: big.NewInt(5),
		BigBlind:   big.NewInt(10),
		Type:       types.CashGame,
	}
	
	game := NewTexasHoldemGame("0x123", options)
	game.AddPlayer("0xPlayer1", 0, big.NewInt(500))
	game.AddPlayer("0xPlayer2", 1, big.NewInt(500))
	
	active := game.GetActivePlayers()
	if len(active) != 2 {
		t.Errorf("Expected 2 active players, got %d", len(active))
	}
	
	// Fold a player
	game.players[0].Status = types.Folded
	active = game.GetActivePlayers()
	if len(active) != 1 {
		t.Errorf("Expected 1 active player, got %d", len(active))
	}
}
