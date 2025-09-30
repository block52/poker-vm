package types

func NewMsgMuckCards(creator string, gameId uint64) *MsgMuckCards {
	return &MsgMuckCards{
		Creator: creator,
		GameId:  gameId,
	}
}
