package types

func NewMsgFold(creator string, gameId uint64) *MsgFold {
	return &MsgFold{
		Creator: creator,
		GameId:  gameId,
	}
}
