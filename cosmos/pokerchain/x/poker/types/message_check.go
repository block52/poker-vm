package types

func NewMsgCheck(creator string, gameId uint64) *MsgCheck {
	return &MsgCheck{
		Creator: creator,
		GameId:  gameId,
	}
}
