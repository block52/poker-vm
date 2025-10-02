package types

// DONTCOVER

import (
	"cosmossdk.io/errors"
)

// x/poker module sentinel errors
var (
	ErrInvalidSigner      = errors.Register(ModuleName, 1100, "expected gov account as only signer for proposal message")
	ErrGameAlreadyExists  = errors.Register(ModuleName, 1101, "game already exists")
	ErrGameNotFound       = errors.Register(ModuleName, 1102, "game not found")
	ErrInvalidTableType   = errors.Register(ModuleName, 1103, "invalid table type")
)
