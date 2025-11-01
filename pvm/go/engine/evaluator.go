package engine

import (
	"sort"
	"strings"
)

// HandRank represents the rank of a poker hand
type HandRank int

const (
	HighCard HandRank = iota
	OnePair
	TwoPair
	ThreeOfAKind
	Straight
	Flush
	FullHouse
	FourOfAKind
	StraightFlush
	RoyalFlush
)

var handRankNames = []string{
	"High Card",
	"One Pair",
	"Two Pair",
	"Three of a Kind",
	"Straight",
	"Flush",
	"Full House",
	"Four of a Kind",
	"Straight Flush",
	"Royal Flush",
}

// HandRankName returns the name of the hand rank
func (h HandRank) String() string {
	if h >= 0 && int(h) < len(handRankNames) {
		return handRankNames[h]
	}
	return "Unknown"
}

// HandEvaluator evaluates poker hands
type HandEvaluator struct {
	rankValues map[byte]int
}

// NewHandEvaluator creates a new hand evaluator
func NewHandEvaluator() *HandEvaluator {
	return &HandEvaluator{
		rankValues: map[byte]int{
			'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
			'9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
		},
	}
}

// Card represents a playing card
type Card struct {
	Rank byte // '2'-'9', 'T', 'J', 'Q', 'K', 'A'
	Suit byte // 'C', 'D', 'H', 'S'
}

// ParseCard parses a card string (e.g., "AS", "KH", "2C")
func ParseCard(s string) Card {
	if len(s) != 2 {
		return Card{}
	}
	return Card{Rank: s[0], Suit: s[1]}
}

// EvaluateHand evaluates the best 5-card hand from 7 cards
func (e *HandEvaluator) EvaluateHand(holeCards, communityCards []string) (HandRank, []Card, int) {
	// Parse all cards
	allCards := []Card{}
	for _, cardStr := range append(holeCards, communityCards...) {
		allCards = append(allCards, ParseCard(cardStr))
	}
	
	if len(allCards) != 7 {
		return HighCard, []Card{}, 0
	}
	
	// Find the best 5-card combination
	bestRank := HighCard
	var bestHand []Card
	bestScore := 0
	
	// Generate all 5-card combinations from 7 cards
	combinations := e.generate5CardCombinations(allCards)
	
	for _, combo := range combinations {
		rank, score := e.evaluateFiveCards(combo)
		if rank > bestRank || (rank == bestRank && score > bestScore) {
			bestRank = rank
			bestHand = combo
			bestScore = score
		}
	}
	
	return bestRank, bestHand, bestScore
}

// generate5CardCombinations generates all possible 5-card combinations from 7 cards
func (e *HandEvaluator) generate5CardCombinations(cards []Card) [][]Card {
	combinations := [][]Card{}
	
	// Use bit manipulation to generate all combinations
	for i := 0; i < (1 << 7); i++ {
		if countBits(i) == 5 {
			combo := []Card{}
			for j := 0; j < 7; j++ {
				if (i & (1 << j)) != 0 {
					combo = append(combo, cards[j])
				}
			}
			combinations = append(combinations, combo)
		}
	}
	
	return combinations
}

// countBits counts the number of 1 bits in an integer
func countBits(n int) int {
	count := 0
	for n > 0 {
		count += n & 1
		n >>= 1
	}
	return count
}

// evaluateFiveCards evaluates a 5-card hand
func (e *HandEvaluator) evaluateFiveCards(cards []Card) (HandRank, int) {
	// Sort cards by rank value
	sortedCards := make([]Card, len(cards))
	copy(sortedCards, cards)
	sort.Slice(sortedCards, func(i, j int) bool {
		return e.rankValues[sortedCards[i].Rank] > e.rankValues[sortedCards[j].Rank]
	})
	
	isFlush := e.isFlush(sortedCards)
	isStraight, straightHigh := e.isStraight(sortedCards)
	
	// Check for Royal Flush
	if isFlush && isStraight && straightHigh == 14 {
		return RoyalFlush, e.calculateScore(sortedCards)
	}
	
	// Check for Straight Flush
	if isFlush && isStraight {
		return StraightFlush, e.calculateScore(sortedCards)
	}
	
	// Count rank frequencies
	rankCounts := e.getRankCounts(sortedCards)
	
	// Check for Four of a Kind
	if e.hasFourOfAKind(rankCounts) {
		return FourOfAKind, e.calculateScore(sortedCards)
	}
	
	// Check for Full House
	if e.hasFullHouse(rankCounts) {
		return FullHouse, e.calculateScore(sortedCards)
	}
	
	// Check for Flush
	if isFlush {
		return Flush, e.calculateScore(sortedCards)
	}
	
	// Check for Straight
	if isStraight {
		return Straight, e.calculateScore(sortedCards)
	}
	
	// Check for Three of a Kind
	if e.hasThreeOfAKind(rankCounts) {
		return ThreeOfAKind, e.calculateScore(sortedCards)
	}
	
	// Check for Two Pair
	if e.hasTwoPair(rankCounts) {
		return TwoPair, e.calculateScore(sortedCards)
	}
	
	// Check for One Pair
	if e.hasOnePair(rankCounts) {
		return OnePair, e.calculateScore(sortedCards)
	}
	
	// High Card
	return HighCard, e.calculateScore(sortedCards)
}

// isFlush checks if all cards have the same suit
func (e *HandEvaluator) isFlush(cards []Card) bool {
	if len(cards) == 0 {
		return false
	}
	suit := cards[0].Suit
	for _, card := range cards[1:] {
		if card.Suit != suit {
			return false
		}
	}
	return true
}

// isStraight checks if cards form a straight
func (e *HandEvaluator) isStraight(cards []Card) (bool, int) {
	if len(cards) != 5 {
		return false, 0
	}
	
	ranks := []int{}
	for _, card := range cards {
		ranks = append(ranks, e.rankValues[card.Rank])
	}
	sort.Sort(sort.Reverse(sort.IntSlice(ranks)))
	
	// Check for regular straight
	for i := 0; i < 4; i++ {
		if ranks[i] != ranks[i+1]+1 {
			// Check for A-2-3-4-5 (wheel)
			if i == 0 && ranks[0] == 14 && ranks[1] == 5 && ranks[2] == 4 && ranks[3] == 3 && ranks[4] == 2 {
				return true, 5 // Wheel straight high is 5
			}
			return false, 0
		}
	}
	
	return true, ranks[0]
}

// getRankCounts returns a map of rank to count
func (e *HandEvaluator) getRankCounts(cards []Card) map[byte]int {
	counts := make(map[byte]int)
	for _, card := range cards {
		counts[card.Rank]++
	}
	return counts
}

// hasFourOfAKind checks for four of a kind
func (e *HandEvaluator) hasFourOfAKind(counts map[byte]int) bool {
	for _, count := range counts {
		if count == 4 {
			return true
		}
	}
	return false
}

// hasFullHouse checks for full house
func (e *HandEvaluator) hasFullHouse(counts map[byte]int) bool {
	hasThree := false
	hasPair := false
	for _, count := range counts {
		if count == 3 {
			hasThree = true
		}
		if count == 2 {
			hasPair = true
		}
	}
	return hasThree && hasPair
}

// hasThreeOfAKind checks for three of a kind
func (e *HandEvaluator) hasThreeOfAKind(counts map[byte]int) bool {
	for _, count := range counts {
		if count == 3 {
			return true
		}
	}
	return false
}

// hasTwoPair checks for two pair
func (e *HandEvaluator) hasTwoPair(counts map[byte]int) bool {
	pairs := 0
	for _, count := range counts {
		if count == 2 {
			pairs++
		}
	}
	return pairs == 2
}

// hasOnePair checks for one pair
func (e *HandEvaluator) hasOnePair(counts map[byte]int) bool {
	for _, count := range counts {
		if count == 2 {
			return true
		}
	}
	return false
}

// calculateScore calculates a score for tie-breaking
func (e *HandEvaluator) calculateScore(cards []Card) int {
	score := 0
	for i, card := range cards {
		score += e.rankValues[card.Rank] * (1 << (4 - i))
	}
	return score
}

// CompareHands compares two hands and returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
func (e *HandEvaluator) CompareHands(hole1, hole2, community []string) int {
	rank1, _, score1 := e.EvaluateHand(hole1, community)
	rank2, _, score2 := e.EvaluateHand(hole2, community)
	
	if rank1 > rank2 {
		return 1
	}
	if rank1 < rank2 {
		return -1
	}
	
	// Same rank, compare scores
	if score1 > score2 {
		return 1
	}
	if score1 < score2 {
		return -1
	}
	
	return 0
}

// FormatHand formats a hand for display
func FormatHand(cards []Card) string {
	cardStrs := []string{}
	for _, card := range cards {
		cardStrs = append(cardStrs, string(card.Rank)+string(card.Suit))
	}
	return strings.Join(cardStrs, " ")
}
