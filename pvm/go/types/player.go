package types

import "math/big"

// Player represents a player in the poker game
type Player struct {
	Address      string
	Seat         int
	Stack        *big.Int
	IsSmallBlind bool
	IsBigBlind   bool
	IsDealer     bool
	HoleCards    []string
	Status       PlayerStatus
	LastAction   *ActionDTO
	SumOfBets    *big.Int
	Timeout      int64
}

// NewPlayer creates a new player instance
func NewPlayer(address string, seat int, stack *big.Int) *Player {
	return &Player{
		Address:      address,
		Seat:         seat,
		Stack:        new(big.Int).Set(stack),
		IsSmallBlind: false,
		IsBigBlind:   false,
		IsDealer:     false,
		HoleCards:    []string{},
		Status:       Active,
		LastAction:   nil,
		SumOfBets:    big.NewInt(0),
		Timeout:      0,
	}
}

// IsActive checks if the player can take actions
func (p *Player) IsActive() bool {
	return p.Status == Active || p.Status == NotActed
}

// IsFolded checks if the player has folded
func (p *Player) IsFolded() bool {
	return p.Status == Folded
}

// IsAllIn checks if the player is all-in
func (p *Player) IsAllIn() bool {
	return p.Status == AllInStatus
}

// CanAct checks if the player can currently act
func (p *Player) CanAct() bool {
	return p.IsActive() && p.Stack.Cmp(big.NewInt(0)) > 0
}

// AddToStack adds chips to the player's stack
func (p *Player) AddToStack(amount *big.Int) {
	p.Stack.Add(p.Stack, amount)
}

// RemoveFromStack removes chips from the player's stack
func (p *Player) RemoveFromStack(amount *big.Int) error {
	if p.Stack.Cmp(amount) < 0 {
		return ErrInsufficientChips
	}
	p.Stack.Sub(p.Stack, amount)
	return nil
}

// ToDTO converts Player to PlayerDTO
func (p *Player) ToDTO(legalActions []LegalActionDTO) PlayerDTO {
	return PlayerDTO{
		Address:      p.Address,
		Seat:         p.Seat,
		Stack:        p.Stack.String(),
		IsSmallBlind: p.IsSmallBlind,
		IsBigBlind:   p.IsBigBlind,
		IsDealer:     p.IsDealer,
		HoleCards:    p.HoleCards,
		Status:       p.Status,
		LastAction:   p.LastAction,
		LegalActions: legalActions,
		SumOfBets:    p.SumOfBets.String(),
		Timeout:      p.Timeout,
		Signature:    "0x0000000000000000000000000000000000000000000000000000000000000000",
	}
}
