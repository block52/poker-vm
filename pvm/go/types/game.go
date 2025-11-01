package types

import "math/big"

// PlayerActionType represents actions a player can take
type PlayerActionType string

const (
	SmallBlind PlayerActionType = "post-small-blind"
	BigBlind   PlayerActionType = "post-big-blind"
	Fold       PlayerActionType = "fold"
	Check      PlayerActionType = "check"
	Bet        PlayerActionType = "bet"
	Call       PlayerActionType = "call"
	Raise      PlayerActionType = "raise"
	AllIn      PlayerActionType = "all-in"
	Muck       PlayerActionType = "muck"
	Show       PlayerActionType = "show"
)

// NonPlayerActionType represents system actions
type NonPlayerActionType string

const (
	Deal          NonPlayerActionType = "deal"
	DealFlop      NonPlayerActionType = "deal-flop"
	DealTurn      NonPlayerActionType = "deal-turn"
	DealRiver     NonPlayerActionType = "deal-river"
	DealShowdown  NonPlayerActionType = "deal-showdown"
	Winner        NonPlayerActionType = "winner"
	ReturnBet     NonPlayerActionType = "return-bet"
	CollectBlinds NonPlayerActionType = "collect-blinds"
	NewHand       NonPlayerActionType = "new-hand"
	BustOut       NonPlayerActionType = "bust-out"
)

// GameType represents the type of poker game
type GameType string

const (
	CashGame   GameType = "cash-game"
	SitAndGo   GameType = "sit-and-go"
	Tournament GameType = "tournament"
)

// GameStatus represents the current status of the game
type GameStatus string

const (
	WaitingForPlayers GameStatus = "waiting-for-players"
	Registration      GameStatus = "registration"
	InProgress        GameStatus = "in-progress"
	Finished          GameStatus = "finished"
)

// PlayerStatus represents the current status of a player
type PlayerStatus string

const (
	NotActed    PlayerStatus = "not-acted"
	Active      PlayerStatus = "active"
	Folded      PlayerStatus = "folded"
	AllInStatus PlayerStatus = "all-in"
	Busted      PlayerStatus = "busted"
	SittingOut  PlayerStatus = "sitting-out"
	SittingIn   PlayerStatus = "sitting-in"
	Showing     PlayerStatus = "showing"
)

// TexasHoldemRound represents the current betting round
type TexasHoldemRound string

const (
	Ante     TexasHoldemRound = "ante"
	Preflop  TexasHoldemRound = "preflop"
	Flop     TexasHoldemRound = "flop"
	Turn     TexasHoldemRound = "turn"
	River    TexasHoldemRound = "river"
	Showdown TexasHoldemRound = "showdown"
	End      TexasHoldemRound = "end"
)

// GameOptions contains the configuration for a poker game
type GameOptions struct {
	MinBuyIn     *big.Int               `json:"minBuyIn"`
	MaxBuyIn     *big.Int               `json:"maxBuyIn"`
	MinPlayers   int                    `json:"minPlayers"`
	MaxPlayers   int                    `json:"maxPlayers"`
	SmallBlind   *big.Int               `json:"smallBlind"`
	BigBlind     *big.Int               `json:"bigBlind"`
	Timeout      int                    `json:"timeout"`
	Type         GameType               `json:"type"`
	OtherOptions map[string]interface{} `json:"otherOptions,omitempty"`
}

// ActionDTO represents a player action
type ActionDTO struct {
	PlayerID  string           `json:"playerId"`
	Seat      int              `json:"seat"`
	Action    PlayerActionType `json:"action"`
	Amount    string           `json:"amount"`
	Round     TexasHoldemRound `json:"round"`
	Index     int              `json:"index"`
	Timestamp int64            `json:"timestamp"`
}

// LegalActionDTO represents a legal action available to a player
type LegalActionDTO struct {
	Action PlayerActionType `json:"action"`
	Min    string           `json:"min"`
	Max    string           `json:"max"`
	Index  int              `json:"index"`
}

// PlayerDTO represents a player in the game
type PlayerDTO struct {
	Address      string           `json:"address"`
	Seat         int              `json:"seat"`
	Stack        string           `json:"stack"`
	IsSmallBlind bool             `json:"isSmallBlind"`
	IsBigBlind   bool             `json:"isBigBlind"`
	IsDealer     bool             `json:"isDealer"`
	HoleCards    []string         `json:"holeCards"`
	Status       PlayerStatus     `json:"status"`
	LastAction   *ActionDTO       `json:"lastAction,omitempty"`
	LegalActions []LegalActionDTO `json:"legalActions"`
	SumOfBets    string           `json:"sumOfBets"`
	Timeout      int64            `json:"timeout"`
	Signature    string           `json:"signature"`
}

// ResultDTO represents a player's result in the game
type ResultDTO struct {
	Place    int    `json:"place"`
	PlayerID string `json:"playerId"`
	Payout   string `json:"payout"`
}

// WinnerDTO represents a pot winner
type WinnerDTO struct {
	PlayerID string   `json:"playerId"`
	Hand     []string `json:"hand"`
	Rank     string   `json:"rank"`
	PotIndex int      `json:"potIndex"`
	Amount   string   `json:"amount"`
}

// TexasHoldemStateDTO represents the complete game state
type TexasHoldemStateDTO struct {
	Type               GameType         `json:"type"`
	Address            string           `json:"address"`
	GameOptions        GameOptions      `json:"gameOptions"`
	SmallBlindPosition int              `json:"smallBlindPosition"`
	BigBlindPosition   int              `json:"bigBlindPosition"`
	Dealer             int              `json:"dealer"`
	Players            []PlayerDTO      `json:"players"`
	CommunityCards     []string         `json:"communityCards"`
	Deck               string           `json:"deck"`
	Pots               []string         `json:"pots"`
	LastActedSeat      int              `json:"lastActedSeat"`
	ActionCount        int              `json:"actionCount"`
	HandNumber         int              `json:"handNumber"`
	NextToAct          int              `json:"nextToAct"`
	PreviousActions    []ActionDTO      `json:"previousActions"`
	Round              TexasHoldemRound `json:"round"`
	Winners            []WinnerDTO      `json:"winners"`
	Results            []ResultDTO      `json:"results"`
	Signature          string           `json:"signature"`
}
