import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import { IAction, Range } from "../types";

class DealAction extends BaseAction implements IAction {
    get type(): NonPlayerActionType {
        return NonPlayerActionType.DEAL;
    }

    verify(player: Player): Range {
        console.log(`[DEBUG] Verifying deal action in round: ${this.game.currentRound}`);
        
        // Can deal in either ANTE or PREFLOP rounds
        if (this.game.currentRound !== TexasHoldemRound.PREFLOP && this.game.currentRound !== TexasHoldemRound.ANTE) {
            console.log(`[DEBUG] Cannot deal: wrong round (${this.game.currentRound})`);
            throw new Error("Can only deal when in preflop or ante round.");
        }

        const count = this.game.getPlayerCount();
        if (count < 2) {
            console.log(`[DEBUG] Cannot deal: not enough players (${count})`);
            throw new Error("Not enough players to deal.");
        }

        // Get actions from current round
        const preFlopActions = this.game.getActionsForRound(TexasHoldemRound.PREFLOP);
        const anteActions = this.game.getActionsForRound(TexasHoldemRound.ANTE);

        console.log(`[DEBUG] Actions in PREFLOP: ${preFlopActions.length}, Actions in ANTE: ${anteActions.length}`);
        
        // Check if at least the small blind has been posted (either in ANTE or PREFLOP)
        const smallBlindPosted = 
            anteActions.some(a => a.action === PlayerActionType.SMALL_BLIND) || 
            preFlopActions.some(a => a.action === PlayerActionType.SMALL_BLIND);
        
        if (!smallBlindPosted) {
            console.log(`[DEBUG] Cannot deal: small blind not yet posted`);
            throw new Error("Small blind must be posted before dealing.");
        }

        // Check if cards have been dealt yet
        const hasDealt = preFlopActions.some(a => a.action === NonPlayerActionType.DEAL) || 
                         anteActions.some(a => a.action === NonPlayerActionType.DEAL);
        
        if (hasDealt) {
            console.log(`[DEBUG] Cannot deal: cards already dealt`);
            throw new Error("Cards have already been dealt for this hand.");
        }
        
        const anyPlayerHasCards = Array.from(this.game.players.values()).some(p => p !== null && p.holeCards !== undefined);
        if (anyPlayerHasCards) {
            console.log(`[DEBUG] Cannot deal: players already have cards`);
            throw new Error("Cards have already been dealt for this hand.");
        }
        
        // Check for blinds and betting conditions if in PREFLOP
        if (this.game.currentRound === TexasHoldemRound.PREFLOP) {
            // Check for big blind in PREFLOP
            const bigBlindAction = preFlopActions.find(a => a.action === PlayerActionType.BIG_BLIND);
            if (!bigBlindAction) {
                console.log(`[DEBUG] Cannot deal: no big blind posted`);
                throw new Error("Big blind must be posted before we can deal.");
            }
            
            // Check if small blind has acted after big blind
            const smallBlindPlayerId = anteActions.find(a => a.action === PlayerActionType.SMALL_BLIND)?.playerId ||
                                     preFlopActions.find(a => a.action === PlayerActionType.SMALL_BLIND)?.playerId;
            
            if (smallBlindPlayerId) {
                // Find actions by small blind player in PREFLOP
                const smallBlindActionsInPreflop = preFlopActions.filter(a => 
                    a.playerId === smallBlindPlayerId && 
                    a.action !== PlayerActionType.SMALL_BLIND
                );
                
                // Check if the player who posted the small blind has acted in PREFLOP
                const smallBlindHasActed = smallBlindActionsInPreflop.length > 0;
                console.log(`[DEBUG] Small blind has acted in PREFLOP: ${smallBlindHasActed}`);
                
                // Get all active players
                const activePlayers = this.game.getSeatedPlayers().filter(p => 
                    this.game.getPlayerStatus(p.address) !== PlayerStatus.FOLDED &&
                    this.game.getPlayerStatus(p.address) !== PlayerStatus.SITTING_OUT
                );
                
                // Check if all bets are equal
                let allBetsEqual = true;
                let lastBet = null;
                
                for (const player of activePlayers) {
                    const bet = this.game.getPlayerTotalBets(player.address);
                    console.log(`[DEBUG] Player ${player.address} bet: ${bet}`);
                    
                    if (lastBet === null) {
                        lastBet = bet;
                    } else if (bet !== lastBet) {
                        allBetsEqual = false;
                        break;
                    }
                }
                
                console.log(`[DEBUG] All bets equal: ${allBetsEqual}`);
                
                // In PREFLOP, we want to make sure that:
                // 1. Both blinds are posted
                // 2. Small blind has acted
                // 3. All bets are equal
                if (!smallBlindHasActed && !allBetsEqual) {
                    console.log(`[DEBUG] Cannot deal: small blind hasn't acted or bets are not equal`);
                    throw new Error("Cannot deal until all players have acted and bets are equal.");
                }
            }
        }

        // Get the player's seat
        const playerSeat = this.game.getPlayerSeatNumber(player.address);
        
        // In a 2-player game, the small blind player is also the dealer
        if (count === 2) {
            const smallBlindPosition = this.game.smallBlindPosition;
            if (playerSeat !== smallBlindPosition) {
                console.log(`[DEBUG] Cannot deal: player ${playerSeat} is not small blind (${smallBlindPosition})`);
                throw new Error("In heads-up play, only the small blind player can deal the cards.");
            }
        } else {
            // For 3+ players, use the regular dealer position check
            if (playerSeat !== this.game.dealerPosition) {
                console.log(`[DEBUG] Cannot deal: player ${playerSeat} is not dealer (${this.game.dealerPosition})`);
                throw new Error("Only the dealer can deal the cards.");
            }
        }

        console.log(`[DEBUG] Deal action is legal`);
        return { minAmount: 0n, maxAmount: 0n };
    }

    execute(player: Player, index: number): void {
        this.verify(player);
        
        console.log(`[DEBUG] Executing deal action by player ${player.address}`);
        this.game.deal();

        // The verification should have already been done
        // The actual dealing of cards happens in the game class
        // Record the deal action
        this.update.addAction({
            playerId: player.address,
            action: NonPlayerActionType.DEAL,
            index: index
        });
    }
}

export default DealAction;
