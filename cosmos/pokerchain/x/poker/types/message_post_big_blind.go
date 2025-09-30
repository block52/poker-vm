package types

func NewMsgPostBigBlind(creator string, gameId uint64) *MsgPostBigBlind {
	return &MsgPostBigBlind{
		Creator: creator,
		GameId:  gameId,
	}
}
