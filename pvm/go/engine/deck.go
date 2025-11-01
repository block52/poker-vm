package engine

import (
	"math/rand"
	"strings"
	"time"
)

// Deck represents a deck of cards
type Deck struct {
	cards []string
	index int
}

// NewDeck creates a new standard 52-card deck
func NewDeck() *Deck {
	ranks := []string{"2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"}
	suits := []string{"C", "D", "H", "S"}

	cards := []string{}
	for _, rank := range ranks {
		for _, suit := range suits {
			cards = append(cards, rank+suit)
		}
	}

	return &Deck{
		cards: cards,
		index: 0,
	}
}

// Shuffle shuffles the deck
func (d *Deck) Shuffle() {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	r.Shuffle(len(d.cards), func(i, j int) {
		d.cards[i], d.cards[j] = d.cards[j], d.cards[i]
	})
	d.index = 0
}

// Deal deals n cards from the deck
func (d *Deck) Deal(n int) []string {
	if d.index+n > len(d.cards) {
		return []string{}
	}

	cards := d.cards[d.index : d.index+n]
	d.index += n
	return cards
}

// Burn burns (discards) one card
func (d *Deck) Burn() {
	if d.index < len(d.cards) {
		d.index++
	}
}

// Remaining returns the number of cards remaining in the deck
func (d *Deck) Remaining() int {
	return len(d.cards) - d.index
}

// ToString converts the deck to a string representation
func (d *Deck) ToString() string {
	dealt := d.cards[:d.index]
	remaining := d.cards[d.index:]

	result := strings.Join(dealt, "-")
	if len(dealt) > 0 && len(remaining) > 0 {
		result += "-"
	}
	result += "[" + strings.Join(remaining, "-") + "]"

	return result
}
