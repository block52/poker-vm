package engine

import (
	"math/big"
	"sort"
	"time"

	"github.com/block52/poker-vm/pvm/go/types"
)

// TexasHoldemGame represents a Texas Hold'em poker game
type TexasHoldemGame struct {
	gameType           types.GameType
	address            string
	gameOptions        types.GameOptions
	players            map[int]*types.Player // seat -> player
	communityCards     []string
	deck               *Deck
	pots               []*big.Int
	currentRound       types.TexasHoldemRound
	dealerPosition     int
	smallBlindPosition int
	bigBlindPosition   int
	nextToAct          int
	lastActedSeat      int
	actionCount        int
	handNumber         int
	previousActions    []types.ActionDTO
	winners            []types.WinnerDTO
	results            []types.ResultDTO
	status             types.GameStatus
}

// NewTexasHoldemGame creates a new Texas Hold'em game instance
func NewTexasHoldemGame(address string, options types.GameOptions) *TexasHoldemGame {
	return &TexasHoldemGame{
		gameType:           options.Type,
		address:            address,
		gameOptions:        options,
		players:            make(map[int]*types.Player),
		communityCards:     []string{},
		deck:               NewDeck(),
		pots:               []*big.Int{big.NewInt(0)},
		currentRound:       types.Ante,
		dealerPosition:     -1,
		smallBlindPosition: -1,
		bigBlindPosition:   -1,
		nextToAct:          -1,
		lastActedSeat:      -1,
		actionCount:        0,
		handNumber:         0,
		previousActions:    []types.ActionDTO{},
		winners:            []types.WinnerDTO{},
		results:            []types.ResultDTO{},
		status:             types.WaitingForPlayers,
	}
}

// AddPlayer adds a player to the game
func (g *TexasHoldemGame) AddPlayer(address string, seat int, buyIn *big.Int) error {
	if seat < 0 || seat >= g.gameOptions.MaxPlayers {
		return types.ErrInvalidSeat
	}

	if _, exists := g.players[seat]; exists {
		return types.ErrSeatOccupied
	}

	if buyIn.Cmp(g.gameOptions.MinBuyIn) < 0 {
		return types.ErrInsufficientChips
	}

	if buyIn.Cmp(g.gameOptions.MaxBuyIn) > 0 {
		return types.ErrInvalidBetAmount
	}

	player := types.NewPlayer(address, seat, buyIn)
	g.players[seat] = player

	return nil
}

// StartHand starts a new hand
func (g *TexasHoldemGame) StartHand() error {
	if !g.CanStart() {
		return types.ErrNotEnoughPlayers
	}

	// Reset for new hand
	g.handNumber++
	g.communityCards = []string{}
	g.deck = NewDeck()
	g.deck.Shuffle()
	g.pots = []*big.Int{big.NewInt(0)}
	g.currentRound = types.Preflop
	g.actionCount = 0
	g.previousActions = []types.ActionDTO{}
	g.winners = []types.WinnerDTO{}
	g.status = types.InProgress

	// Reset player states
	for _, player := range g.players {
		player.HoleCards = []string{}
		player.Status = types.Active
		player.LastAction = nil
		player.SumOfBets = big.NewInt(0)
		player.IsSmallBlind = false
		player.IsBigBlind = false
		player.IsDealer = false
	}

	// Set dealer position
	if g.dealerPosition < 0 {
		// First hand, find first active player
		for seat := 0; seat < g.gameOptions.MaxPlayers; seat++ {
			if player, exists := g.players[seat]; exists && player.IsActive() {
				g.dealerPosition = seat
				break
			}
		}
	} else {
		g.rotateDealerButton()
	}

	// Set blind positions
	g.setBlindPositions()

	// Post blinds
	if err := g.postBlinds(); err != nil {
		return err
	}

	// Deal hole cards
	g.dealHoleCards()

	// Set first to act (left of big blind)
	g.determineNextToAct()

	return nil
}

// setBlindPositions sets small blind and big blind positions
func (g *TexasHoldemGame) setBlindPositions() {
	activePlayers := g.GetActivePlayers()
	if len(activePlayers) < 2 {
		return
	}

	// Small blind is left of dealer
	g.smallBlindPosition = g.getNextActivePlayerSeat(g.dealerPosition)
	if player, exists := g.players[g.smallBlindPosition]; exists {
		player.IsSmallBlind = true
	}

	// Big blind is left of small blind
	g.bigBlindPosition = g.getNextActivePlayerSeat(g.smallBlindPosition)
	if player, exists := g.players[g.bigBlindPosition]; exists {
		player.IsBigBlind = true
	}
}

// getNextActivePlayerSeat returns the next active player seat after the given seat
func (g *TexasHoldemGame) getNextActivePlayerSeat(afterSeat int) int {
	for i := 1; i <= g.gameOptions.MaxPlayers; i++ {
		seat := (afterSeat + i) % g.gameOptions.MaxPlayers
		if player, exists := g.players[seat]; exists && player.IsActive() {
			return seat
		}
	}
	return -1
}

// postBlinds collects blinds from players
func (g *TexasHoldemGame) postBlinds() error {
	// Post small blind
	if sbPlayer, exists := g.players[g.smallBlindPosition]; exists {
		sbAmount := new(big.Int).Set(g.gameOptions.SmallBlind)
		if sbAmount.Cmp(sbPlayer.Stack) > 0 {
			sbAmount = new(big.Int).Set(sbPlayer.Stack)
		}

		if err := sbPlayer.RemoveFromStack(sbAmount); err != nil {
			return err
		}
		sbPlayer.SumOfBets.Add(sbPlayer.SumOfBets, sbAmount)
		g.pots[0].Add(g.pots[0], sbAmount)

		sbPlayer.LastAction = &types.ActionDTO{
			PlayerID:  sbPlayer.Address,
			Seat:      sbPlayer.Seat,
			Action:    types.SmallBlind,
			Amount:    sbAmount.String(),
			Round:     g.currentRound,
			Index:     g.actionCount,
			Timestamp: time.Now().UnixMilli(),
		}
		g.previousActions = append(g.previousActions, *sbPlayer.LastAction)
		g.actionCount++
	}

	// Post big blind
	if bbPlayer, exists := g.players[g.bigBlindPosition]; exists {
		bbAmount := new(big.Int).Set(g.gameOptions.BigBlind)
		if bbAmount.Cmp(bbPlayer.Stack) > 0 {
			bbAmount = new(big.Int).Set(bbPlayer.Stack)
		}

		if err := bbPlayer.RemoveFromStack(bbAmount); err != nil {
			return err
		}
		bbPlayer.SumOfBets.Add(bbPlayer.SumOfBets, bbAmount)
		g.pots[0].Add(g.pots[0], bbAmount)

		bbPlayer.LastAction = &types.ActionDTO{
			PlayerID:  bbPlayer.Address,
			Seat:      bbPlayer.Seat,
			Action:    types.BigBlind,
			Amount:    bbAmount.String(),
			Round:     g.currentRound,
			Index:     g.actionCount,
			Timestamp: time.Now().UnixMilli(),
		}
		g.previousActions = append(g.previousActions, *bbPlayer.LastAction)
		g.actionCount++
	}

	return nil
}

// dealHoleCards deals 2 cards to each active player
func (g *TexasHoldemGame) dealHoleCards() {
	for i := 0; i < 2; i++ {
		currentSeat := g.dealerPosition
		for j := 0; j < len(g.players); j++ {
			currentSeat = g.getNextActivePlayerSeat(currentSeat)
			if player, exists := g.players[currentSeat]; exists && player.IsActive() {
				cards := g.deck.Deal(1)
				if len(cards) > 0 {
					player.HoleCards = append(player.HoleCards, cards[0])
				}
			}
		}
	}
}

// GetActivePlayers returns all active players
func (g *TexasHoldemGame) GetActivePlayers() []*types.Player {
	var active []*types.Player
	for _, player := range g.players {
		if player.IsActive() {
			active = append(active, player)
		}
	}
	return active
}

// GetPlayerCount returns the number of players in the game
func (g *TexasHoldemGame) GetPlayerCount() int {
	return len(g.players)
}

// CanStart checks if the game can start
func (g *TexasHoldemGame) CanStart() bool {
	activeCount := len(g.GetActivePlayers())
	return activeCount >= g.gameOptions.MinPlayers && activeCount <= g.gameOptions.MaxPlayers
}

// GetNextPlayerToAct returns the next player who should act
func (g *TexasHoldemGame) GetNextPlayerToAct() *types.Player {
	if g.nextToAct < 0 {
		return nil
	}
	return g.players[g.nextToAct]
}

// PerformAction executes a player action
func (g *TexasHoldemGame) PerformAction(playerID string, action types.PlayerActionType, amount *big.Int) error {
	// Find the player
	var player *types.Player
	for _, p := range g.players {
		if p.Address == playerID {
			player = p
			break
		}
	}

	if player == nil {
		return types.ErrPlayerNotFound
	}

	// Validate it's the player's turn
	if g.nextToAct != player.Seat {
		return types.ErrActionOutOfTurn
	}

	// Create action DTO
	actionDTO := types.ActionDTO{
		PlayerID:  playerID,
		Seat:      player.Seat,
		Action:    action,
		Amount:    amount.String(),
		Round:     g.currentRound,
		Index:     g.actionCount,
		Timestamp: time.Now().UnixMilli(),
	}

	// Process the action
	if err := g.processAction(player, action, amount); err != nil {
		return err
	}

	// Record the action
	player.LastAction = &actionDTO
	g.previousActions = append(g.previousActions, actionDTO)
	g.lastActedSeat = player.Seat
	g.actionCount++

	// Determine next player to act
	g.determineNextToAct()

	// Check if round is complete
	if g.isBettingRoundComplete() {
		g.advanceRound()
	}

	return nil
}

// processAction handles the logic for a specific action
func (g *TexasHoldemGame) processAction(player *types.Player, action types.PlayerActionType, amount *big.Int) error {
	switch action {
	case types.Fold:
		player.Status = types.Folded

	case types.Check:
		// Check is only valid if no bet to call
		if !g.canCheck(player) {
			return types.ErrInvalidAction
		}

	case types.Call:
		callAmount := g.getCallAmount(player)
		if err := player.RemoveFromStack(callAmount); err != nil {
			return err
		}
		player.SumOfBets.Add(player.SumOfBets, callAmount)
		g.pots[0].Add(g.pots[0], callAmount)

	case types.Bet, types.Raise:
		if err := player.RemoveFromStack(amount); err != nil {
			return err
		}
		player.SumOfBets.Add(player.SumOfBets, amount)
		g.pots[0].Add(g.pots[0], amount)

	case types.AllIn:
		allInAmount := new(big.Int).Set(player.Stack)
		player.Stack = big.NewInt(0)
		player.SumOfBets.Add(player.SumOfBets, allInAmount)
		g.pots[0].Add(g.pots[0], allInAmount)
		player.Status = types.AllInStatus

	default:
		return types.ErrInvalidAction
	}

	return nil
}

// canCheck returns true if the player can check
func (g *TexasHoldemGame) canCheck(player *types.Player) bool {
	highestBet := g.getHighestBet()
	return player.SumOfBets.Cmp(highestBet) >= 0
}

// getCallAmount returns the amount the player needs to call
func (g *TexasHoldemGame) getCallAmount(player *types.Player) *big.Int {
	highestBet := g.getHighestBet()
	callAmount := new(big.Int).Sub(highestBet, player.SumOfBets)
	if callAmount.Cmp(player.Stack) > 0 {
		return new(big.Int).Set(player.Stack)
	}
	return callAmount
}

// getHighestBet returns the highest bet in the current round
func (g *TexasHoldemGame) getHighestBet() *big.Int {
	highest := big.NewInt(0)
	for _, player := range g.players {
		if player.IsActive() && player.SumOfBets.Cmp(highest) > 0 {
			highest = new(big.Int).Set(player.SumOfBets)
		}
	}
	return highest
}

// determineNextToAct sets the next player to act
func (g *TexasHoldemGame) determineNextToAct() {
	activePlayers := g.GetActivePlayers()
	if len(activePlayers) <= 1 {
		g.nextToAct = -1
		return
	}

	// Find next active player after current position
	currentSeat := g.lastActedSeat
	for i := 0; i < g.gameOptions.MaxPlayers; i++ {
		seat := (currentSeat + i + 1) % g.gameOptions.MaxPlayers
		if player, exists := g.players[seat]; exists && player.CanAct() {
			g.nextToAct = seat
			return
		}
	}

	g.nextToAct = -1
}

// isBettingRoundComplete checks if the current betting round is complete
func (g *TexasHoldemGame) isBettingRoundComplete() bool {
	activePlayers := g.GetActivePlayers()

	if len(activePlayers) <= 1 {
		return true
	}

	highestBet := g.getHighestBet()

	// Check if all active players have acted and matched the highest bet
	for _, player := range activePlayers {
		if player.LastAction == nil || player.LastAction.Round != g.currentRound {
			return false
		}

		// Player must have matched the bet or be all-in
		if player.SumOfBets.Cmp(highestBet) < 0 && !player.IsAllIn() {
			return false
		}
	}

	return true
}

// advanceRound moves the game to the next betting round
func (g *TexasHoldemGame) advanceRound() {
	switch g.currentRound {
	case types.Ante:
		g.currentRound = types.Preflop
	case types.Preflop:
		g.currentRound = types.Flop
		g.dealFlop()
	case types.Flop:
		g.currentRound = types.Turn
		g.dealTurn()
	case types.Turn:
		g.currentRound = types.River
		g.dealRiver()
	case types.River:
		g.currentRound = types.Showdown
		g.determineWinners()
	case types.Showdown:
		g.currentRound = types.End
		g.resetHand()
	}

	// Reset bets for new round
	for _, player := range g.players {
		player.SumOfBets = big.NewInt(0)
	}

	// Set next to act
	g.determineNextToAct()
}

// dealFlop deals the flop (3 community cards)
func (g *TexasHoldemGame) dealFlop() {
	g.deck.Burn()
	g.communityCards = append(g.communityCards, g.deck.Deal(3)...)
}

// dealTurn deals the turn (4th community card)
func (g *TexasHoldemGame) dealTurn() {
	g.deck.Burn()
	g.communityCards = append(g.communityCards, g.deck.Deal(1)...)
}

// dealRiver deals the river (5th community card)
func (g *TexasHoldemGame) dealRiver() {
	g.deck.Burn()
	g.communityCards = append(g.communityCards, g.deck.Deal(1)...)
}

// determineWinners calculates the winners at showdown
func (g *TexasHoldemGame) determineWinners() {
	evaluator := NewHandEvaluator()
	activePlayers := []*types.Player{}

	// Get all players who are active or showing
	for _, player := range g.players {
		if player.IsActive() || player.Status == types.Showing {
			activePlayers = append(activePlayers, player)
		}
	}

	if len(activePlayers) == 0 {
		return
	}

	// If only one active player, they win all pots
	if len(activePlayers) == 1 {
		winner := activePlayers[0]
		potManager := NewPotManager()
		_ = potManager.CreatePots(g.players)
		totalPot := potManager.GetTotalPot()

		g.winners = []types.WinnerDTO{
			{
				PlayerID: winner.Address,
				Hand:     winner.HoleCards,
				Rank:     "Winner by default",
				PotIndex: 0,
				Amount:   totalPot.String(),
			},
		}

		winner.AddToStack(totalPot)
		return
	} // Evaluate all hands
	type playerHand struct {
		player *types.Player
		rank   HandRank
		hand   []Card
		score  int
	}

	playerHands := []playerHand{}
	for _, player := range activePlayers {
		rank, hand, score := evaluator.EvaluateHand(player.HoleCards, g.communityCards)
		playerHands = append(playerHands, playerHand{
			player: player,
			rank:   rank,
			hand:   hand,
			score:  score,
		})
	}

	// Sort by rank and score (descending)
	sort.Slice(playerHands, func(i, j int) bool {
		if playerHands[i].rank != playerHands[j].rank {
			return playerHands[i].rank > playerHands[j].rank
		}
		return playerHands[i].score > playerHands[j].score
	})

	// Find winners (may be multiple in case of tie)
	bestRank := playerHands[0].rank
	bestScore := playerHands[0].score
	winners := []playerHand{}

	for _, ph := range playerHands {
		if ph.rank == bestRank && ph.score == bestScore {
			winners = append(winners, ph)
		}
	}

	// Create pots
	potManager := NewPotManager()
	pots := potManager.CreatePots(g.players)

	// Create winner DTOs
	g.winners = []types.WinnerDTO{}
	for potIndex := range pots {
		for _, winner := range winners {
			handCards := []string{}
			for _, card := range winner.hand {
				handCards = append(handCards, string(card.Rank)+string(card.Suit))
			}

			g.winners = append(g.winners, types.WinnerDTO{
				PlayerID: winner.player.Address,
				Hand:     handCards,
				Rank:     winner.rank.String(),
				PotIndex: potIndex,
				Amount:   "0", // Will be updated by DistributePots
			})
		}
	}

	// Distribute pots
	potManager.DistributePots(g.winners, g.players)

	// Update pot strings for state
	g.pots = make([]*big.Int, len(pots))
	for i, pot := range pots {
		g.pots[i] = new(big.Int).Set(pot.Amount)
	}
}

// resetHand prepares for a new hand
func (g *TexasHoldemGame) resetHand() {
	// Check if game should end
	activeCount := len(g.GetActivePlayers())
	if activeCount < g.gameOptions.MinPlayers {
		g.status = types.Finished
		return
	}

	g.handNumber++
	g.communityCards = []string{}
	g.deck = NewDeck()
	g.deck.Shuffle()
	g.pots = []*big.Int{big.NewInt(0)}
	g.currentRound = types.Ante
	g.actionCount = 0
	g.previousActions = []types.ActionDTO{}

	// Reset player states
	for _, player := range g.players {
		player.HoleCards = []string{}
		player.Status = types.Active
		player.LastAction = nil
		player.SumOfBets = big.NewInt(0)
		player.IsSmallBlind = false
		player.IsBigBlind = false
		player.IsDealer = false
	}

	// Rotate dealer
	g.rotateDealerButton()
}

// rotateDealerButton moves the dealer button to the next player
func (g *TexasHoldemGame) rotateDealerButton() {
	activePlayers := g.GetActivePlayers()
	if len(activePlayers) == 0 {
		return
	}

	// Find next dealer
	for i := 0; i < g.gameOptions.MaxPlayers; i++ {
		seat := (g.dealerPosition + i + 1) % g.gameOptions.MaxPlayers
		if player, exists := g.players[seat]; exists && player.IsActive() {
			g.dealerPosition = seat
			player.IsDealer = true
			break
		}
	}
}

// ToDTO converts the game state to a DTO
func (g *TexasHoldemGame) ToDTO() types.TexasHoldemStateDTO {
	players := []types.PlayerDTO{}
	for seat := 0; seat < g.gameOptions.MaxPlayers; seat++ {
		if player, exists := g.players[seat]; exists {
			legalActions := g.getLegalActionsForPlayer(player)
			players = append(players, player.ToDTO(legalActions))
		}
	}

	pots := []string{}
	for _, pot := range g.pots {
		pots = append(pots, pot.String())
	}

	return types.TexasHoldemStateDTO{
		Type:               g.gameType,
		Address:            g.address,
		GameOptions:        g.gameOptions,
		SmallBlindPosition: g.smallBlindPosition,
		BigBlindPosition:   g.bigBlindPosition,
		Dealer:             g.dealerPosition,
		Players:            players,
		CommunityCards:     g.communityCards,
		Deck:               g.deck.ToString(),
		Pots:               pots,
		LastActedSeat:      g.lastActedSeat,
		ActionCount:        g.actionCount,
		HandNumber:         g.handNumber,
		NextToAct:          g.nextToAct,
		PreviousActions:    g.previousActions,
		Round:              g.currentRound,
		Winners:            g.winners,
		Results:            g.results,
		Signature:          "0x0000000000000000000000000000000000000000000000000000000000000000",
	}
}

// getLegalActionsForPlayer returns the legal actions for a specific player
func (g *TexasHoldemGame) getLegalActionsForPlayer(player *types.Player) []types.LegalActionDTO {
	if g.nextToAct != player.Seat || !player.CanAct() {
		return []types.LegalActionDTO{}
	}

	actions := []types.LegalActionDTO{}

	// Fold is always available (except when can check for free)
	canCheckForFree := g.canCheck(player)
	if !canCheckForFree {
		actions = append(actions, types.LegalActionDTO{
			Action: types.Fold,
			Min:    "0",
			Max:    "0",
			Index:  g.actionCount,
		})
	}

	// Check or call
	if canCheckForFree {
		actions = append(actions, types.LegalActionDTO{
			Action: types.Check,
			Min:    "0",
			Max:    "0",
			Index:  g.actionCount,
		})
	} else {
		callAmount := g.getCallAmount(player)
		actions = append(actions, types.LegalActionDTO{
			Action: types.Call,
			Min:    callAmount.String(),
			Max:    callAmount.String(),
			Index:  g.actionCount,
		})
	}

	// Bet/Raise
	minRaise := new(big.Int).Mul(g.gameOptions.BigBlind, big.NewInt(2))
	maxRaise := new(big.Int).Set(player.Stack)

	if maxRaise.Cmp(minRaise) >= 0 {
		actions = append(actions, types.LegalActionDTO{
			Action: types.Raise,
			Min:    minRaise.String(),
			Max:    maxRaise.String(),
			Index:  g.actionCount,
		})
	}

	// All-in (if player can't make minimum raise)
	if player.Stack.Cmp(big.NewInt(0)) > 0 {
		actions = append(actions, types.LegalActionDTO{
			Action: types.AllIn,
			Min:    player.Stack.String(),
			Max:    player.Stack.String(),
			Index:  g.actionCount,
		})
	}

	return actions
}
