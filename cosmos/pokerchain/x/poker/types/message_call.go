package types

func NewMsgCall(creator string, gameId uint64) *MsgCall {
	return &MsgCall{
		Creator: creator,
		GameId:  gameId,
	}
}
