package types

func NewMsgBet(creator string, gameId uint64, amount uint64) *MsgBet {
	return &MsgBet{
		Creator: creator,
		GameId:  gameId,
		Amount:  amount,
	}
}
