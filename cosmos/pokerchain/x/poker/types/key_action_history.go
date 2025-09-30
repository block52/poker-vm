package types

import "cosmossdk.io/collections"

// ActionHistoryKey is the prefix to retrieve all ActionHistory
var ActionHistoryKey = collections.NewPrefix("actionHistory/value/")
