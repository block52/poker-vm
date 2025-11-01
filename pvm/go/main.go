package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/big"

	"github.com/block52/poker-vm/pvm/go/engine"
	"github.com/block52/poker-vm/pvm/go/types"
)

func main() {
	fmt.Println("=================================")
	fmt.Println("Poker VM - Go Implementation")
	fmt.Println("=================================")
	log.Println("Starting PVM Go server...")

	// Create game options
	minBuyIn, _ := new(big.Int).SetString("1000000000000000000", 10)  // 1 ETH
	maxBuyIn, _ := new(big.Int).SetString("10000000000000000000", 10) // 10 ETH
	smallBlind, _ := new(big.Int).SetString("10000000000000000", 10)  // 0.01 ETH
	bigBlind, _ := new(big.Int).SetString("20000000000000000", 10)    // 0.02 ETH

	options := types.GameOptions{
		MinBuyIn:   minBuyIn,
		MaxBuyIn:   maxBuyIn,
		MinPlayers: 2,
		MaxPlayers: 9,
		SmallBlind: smallBlind,
		BigBlind:   bigBlind,
		Timeout:    30000,
		Type:       types.CashGame,
	}

	// Create a new game
	game := engine.NewTexasHoldemGame("0x1234567890123456789012345678901234567890", options)
	fmt.Println("\n✅ Game created successfully")

	// Add players
	fmt.Println("\n📝 Adding players...")
	buyIn, _ := new(big.Int).SetString("5000000000000000000", 10) // 5 ETH

	err := game.AddPlayer("0xPlayer1", 0, buyIn)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("   Player 1 added at seat 0")

	buyIn2, _ := new(big.Int).SetString("5000000000000000000", 10) // 5 ETH
	err = game.AddPlayer("0xPlayer2", 1, buyIn2)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("   Player 2 added at seat 1")

	fmt.Printf("\n📊 Game Info:\n")
	fmt.Printf("   Players: %d\n", game.GetPlayerCount())
	fmt.Printf("   Can start: %v\n", game.CanStart())

	// Start the hand
	fmt.Println("\n🎲 Starting first hand...")
	err = game.StartHand()
	if err != nil {
		log.Fatal(err)
	}

	// Convert to DTO and display
	state := game.ToDTO()
	fmt.Println("\n📄 Game State:")
	fmt.Printf("   Round: %s\n", state.Round)
	fmt.Printf("   Pot: %s wei\n", state.Pots[0])
	fmt.Printf("   Hand Number: %d\n", state.HandNumber)
	fmt.Printf("   Dealer Position: %d\n", state.Dealer)
	fmt.Printf("   Community Cards: %v\n", state.CommunityCards)

	fmt.Println("\n👥 Players:")
	for i, player := range state.Players {
		fmt.Printf("   [%d] %s\n", i+1, player.Address)
		fmt.Printf("       Seat: %d | Stack: %s wei\n", player.Seat, player.Stack)
		fmt.Printf("       Dealer: %v | SB: %v | BB: %v\n",
			player.IsDealer, player.IsSmallBlind, player.IsBigBlind)
		fmt.Printf("       Hole Cards: %v\n", player.HoleCards)
		fmt.Printf("       Status: %s\n", player.Status)
		if player.LastAction != nil {
			fmt.Printf("       Last Action: %s (%s wei)\n",
				player.LastAction.Action, player.LastAction.Amount)
		}
		fmt.Println()
	}

	// Show next to act
	nextPlayer := game.GetNextPlayerToAct()
	if nextPlayer != nil {
		fmt.Printf("⏭️  Next to act: %s (Seat %d)\n", nextPlayer.Address, nextPlayer.Seat)

		// Get legal actions
		for _, player := range state.Players {
			if player.Address == nextPlayer.Address {
				fmt.Println("\n✨ Legal Actions:")
				for _, action := range player.LegalActions {
					if action.Min == "0" && action.Max == "0" {
						fmt.Printf("   - %s\n", action.Action)
					} else {
						fmt.Printf("   - %s (min: %s, max: %s wei)\n",
							action.Action, action.Min, action.Max)
					}
				}
				break
			}
		}
	}

	// Pretty print JSON
	fmt.Println("\n📋 Full Game State (JSON):")
	jsonData, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(jsonData))

	fmt.Println("\n✅ PVM Go initialized successfully!")
	fmt.Println("\nNext steps:")
	fmt.Println("  1. Implement API server for game interactions")
	fmt.Println("  2. Add blockchain integration")
	fmt.Println("  3. Create comprehensive tests")
	fmt.Println("  4. Add persistence layer")
}
