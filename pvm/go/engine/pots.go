package engine

import (
	"math/big"
	"sort"

	"github.com/block52/poker-vm/pvm/go/types"
)

// PotManager handles pot creation and distribution
type PotManager struct {
	pots []*Pot
}

// Pot represents a single pot in the game
type Pot struct {
	Amount      *big.Int
	EligiblePlayers []int // seat numbers
}

// NewPotManager creates a new pot manager
func NewPotManager() *PotManager {
	return &PotManager{
		pots: []*Pot{},
	}
}

// CreatePots creates side pots based on player bets
func (pm *PotManager) CreatePots(players map[int]*types.Player) []*Pot {
	// Get all players with bets
	type playerBet struct {
		seat   int
		player *types.Player
		bet    *big.Int
	}
	
	playerBets := []playerBet{}
	for seat, player := range players {
		if player.SumOfBets.Cmp(big.NewInt(0)) > 0 {
			playerBets = append(playerBets, playerBet{
				seat:   seat,
				player: player,
				bet:    new(big.Int).Set(player.SumOfBets),
			})
		}
	}
	
	// Sort by bet amount
	sort.Slice(playerBets, func(i, j int) bool {
		return playerBets[i].bet.Cmp(playerBets[j].bet) < 0
	})
	
	pots := []*Pot{}
	prevBet := big.NewInt(0)
	
	for i := 0; i < len(playerBets); i++ {
		currentBet := playerBets[i].bet
		if currentBet.Cmp(prevBet) <= 0 {
			continue
		}
		
		// Calculate pot amount
		betDiff := new(big.Int).Sub(currentBet, prevBet)
		potAmount := big.NewInt(0)
		
		// Eligible players are those who bet at least this amount
		eligibleSeats := []int{}
		for j := i; j < len(playerBets); j++ {
			contribution := new(big.Int).Set(betDiff)
			if playerBets[j].bet.Cmp(new(big.Int).Add(prevBet, betDiff)) < 0 {
				contribution = new(big.Int).Sub(playerBets[j].bet, prevBet)
			}
			potAmount.Add(potAmount, contribution)
			eligibleSeats = append(eligibleSeats, playerBets[j].seat)
		}
		
		if potAmount.Cmp(big.NewInt(0)) > 0 {
			pots = append(pots, &Pot{
				Amount:          potAmount,
				EligiblePlayers: eligibleSeats,
			})
		}
		
		prevBet = new(big.Int).Set(currentBet)
	}
	
	pm.pots = pots
	return pots
}

// DistributePots distributes pots to winners
func (pm *PotManager) DistributePots(winners []types.WinnerDTO, players map[int]*types.Player) {
	for potIndex, pot := range pm.pots {
		// Find eligible winners for this pot
		eligibleWinners := []types.WinnerDTO{}
		for _, winner := range winners {
			// Find player seat
			for seat, player := range players {
				if player.Address == winner.PlayerID {
					// Check if player is eligible for this pot
					for _, eligibleSeat := range pot.EligiblePlayers {
						if seat == eligibleSeat {
							eligibleWinners = append(eligibleWinners, winner)
							break
						}
					}
					break
				}
			}
		}
		
		if len(eligibleWinners) == 0 {
			continue
		}
		
		// Split pot among eligible winners
		shareAmount := new(big.Int).Div(pot.Amount, big.NewInt(int64(len(eligibleWinners))))
		remainder := new(big.Int).Mod(pot.Amount, big.NewInt(int64(len(eligibleWinners))))
		
		for i, winner := range eligibleWinners {
			// Find player
			for _, player := range players {
				if player.Address == winner.PlayerID {
					amount := new(big.Int).Set(shareAmount)
					// Give remainder to first winner
					if i == 0 {
						amount.Add(amount, remainder)
					}
					player.AddToStack(amount)
					
					// Update winner amount
					for j := range winners {
						if winners[j].PlayerID == winner.PlayerID && winners[j].PotIndex == potIndex {
							winners[j].Amount = amount.String()
						}
					}
					break
				}
			}
		}
	}
}

// GetTotalPot returns the total amount in all pots
func (pm *PotManager) GetTotalPot() *big.Int {
	total := big.NewInt(0)
	for _, pot := range pm.pots {
		total.Add(total, pot.Amount)
	}
	return total
}

// GetPotStrings returns pot amounts as strings
func (pm *PotManager) GetPotStrings() []string {
	potStrings := []string{}
	for _, pot := range pm.pots {
		potStrings = append(potStrings, pot.Amount.String())
	}
	return potStrings
}
