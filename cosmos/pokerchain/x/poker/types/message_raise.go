package types

func NewMsgRaise(creator string, gameId uint64, amount uint64) *MsgRaise {
	return &MsgRaise{
		Creator: creator,
		GameId:  gameId,
		Amount:  amount,
	}
}
