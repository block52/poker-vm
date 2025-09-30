package types

func NewMsgShowCards(creator string, gameId uint64) *MsgShowCards {
	return &MsgShowCards{
		Creator: creator,
		GameId:  gameId,
	}
}
