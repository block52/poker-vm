package types

func NewMsgDealCards(creator string, gameId uint64) *MsgDealCards {
	return &MsgDealCards{
		Creator: creator,
		GameId:  gameId,
	}
}
