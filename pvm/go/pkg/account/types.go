package account

type Account struct {
	Address string `json:"address"`
	Balance int64  `json:"balance"`
	Nonce   int64  `json:"nonce"`
}
