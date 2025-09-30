package types

func NewMsgLeaveGame(creator string, gameId uint64) *MsgLeaveGame {
	return &MsgLeaveGame{
		Creator: creator,
		GameId:  gameId,
	}
}
