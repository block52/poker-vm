export const test_json = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x22dfa2150160484310c5163f280f49e23b8fd34326",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "100000000000000000",
                "bigBlind": "200000000000000000",
                "timeout": 300
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 2,
            "dealer": 9,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "300000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "deck": "2S-KH-3C-7C-3D-KC-4C-7S-10S-JD-10D-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-10C-AH-AS-10H-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
                    "holeCards": [
                        "2S",
                        "3C"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "deck": "2S-KH-3C-7C-3D-KC-4C-7S-10S-JD-10D-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-10C-AH-AS-10H-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
                    "holeCards": [
                        "KH",
                        "7C"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        },
                        {
                            "action": "check",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        },
                        {
                            "action": "bet",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "7S",
                "10S",
                "JD",
                "2D"
            ],
            "deck": "2S-KH-3C-7C-3D-KC-4C-7S-10S-JD-10D-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-10C-AH-AS-10H-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
            "pots": [
                "1700000000000000000"
            ],
            "lastToAct": 1,
            "nextToAct": 2,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "100000000000000000",
                    "round": "ante",
                    "index": 1
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "200000000000000000",
                    "round": "ante",
                    "index": 1
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 2
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "raise",
                    "amount": "300000000000000000",
                    "round": "preflop",
                    "index": 3
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "action": "raise",
                    "amount": "600000000000000000",
                    "round": "preflop",
                    "index": 4
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "call",
                    "amount": "100000000000000000",
                    "round": "preflop",
                    "index": 5
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 2,
                    "action": "all-in",
                    "amount": "200000000000000000",
                    "round": "flop",
                    "index": 6
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "call",
                    "amount": "200000000000000000",
                    "round": "flop",
                    "index": 7
                }
            ],
            "round": "turn",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x7ad21711ed2e9b07bb993445de702236356f49b70480a99ba52a587cf9c02a7645d2cf4758d109501bc74d97852afb3b780d5874c068489e1bedc4260c166adc1b"
    }
}

export const test_735 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x5beefcc4e98e5f876ef6e94a2291cde322e38d03",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 300
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 2,
            "dealer": 9,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "1040000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "10D",
                        "5C"
                    ],
                    "status": "showing",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 17
                        },
                        {
                            "action": "new-hand",
                            "min": "0",
                            "max": "0",
                            "index": 17
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "stack": "960000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "5D",
                        "5H"
                    ],
                    "status": "showing",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 17
                        },
                        {
                            "action": "new-hand",
                            "min": "0",
                            "max": "0",
                            "index": 17
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "7D",
                "3C",
                "10C",
                "6D",
                "8H"
            ],
            "deck": "10D-5D-5C-5H-JC-AC-AH-7D-3C-10C-9S-6D-KS-8H-[2C]-QS-9H-AD-JS-6S-8C-10S-7C-KD-2D-7H-4H-5S-7S-9C-4C-8D-2H-2S-4S-3S-3D-QD-9D-4D-QH-AS-JH-QC-JD-6C-8S-3H-KH-6H-KC-10H",
            "pots": [
                "80000000000000000"
            ],
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": -1,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "call",
                    "amount": "10000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 7,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 8,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "bet",
                    "amount": "20000000000000000",
                    "round": "flop",
                    "index": 9,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "call",
                    "amount": "20000000000000000",
                    "round": "flop",
                    "index": 10,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "turn",
                    "index": 11,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "turn",
                    "index": 12,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "river",
                    "index": 13,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "river",
                    "index": 14,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "show",
                    "amount": "",
                    "round": "showdown",
                    "index": 15,
                    "timestamp": 1747964696524
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "show",
                    "amount": "",
                    "round": "showdown",
                    "index": 16,
                    "timestamp": 1747964696524
                }
            ],
            "round": "end",
            "winners": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "amount": "80000000000000000",
                    "cards": [
                        "10D",
                        "5C"
                    ],
                    "name": "Pair",
                    "description": "Pair, 10's"
                }
            ],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x238905a0fc6d149c25b1318582192ccfbc7da2b28462eb26a4bf128d9addc8ab67a97bd28e74e13bee2f5971c2f3081afc1a0d6761448aea795451ff4e55ba4e1c"
    }
}

export const test_753 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x5beefcc4e98e5f876ef6e94a2291cde322e38d03",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 300
            },
            "smallBlindPosition": 2,
            "bigBlindPosition": 1,
            "dealer": 1,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "940000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 20
                        },
                        {
                            "action": "bet",
                            "min": "20000000000000000",
                            "max": "940000000000000000",
                            "index": 20
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 2,
                    "stack": "1030000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 20
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "2D-KC-QC-AH-[5S]-JD-AS-7D-JC-6D-AD-3D-JH-5D-8D-4D-KD-10D-9D-4S-7C-10H-3H-QD-4H-6H-2H-3S-6S-5H-7H-8H-2S-9H-KH-AC-QH-JS-4C-3C-9C-8S-KS-9S-7S-2C-QS-10S-5C-8C-6C-10C",
            "pots": [
                "30000000000000000"
            ],
            "actionCount": 16,
            "handNumber": 2,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 17,
                    "timestamp": 1748047617111
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 18,
                    "timestamp": 1748047617111
                },
                {
                    "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 2,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 19,
                    "timestamp": 1748047617111
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xcc22a3ff1ea830b675154517cc600e2fa5b03f2fc05c6ec8b75ee48ba188dbdf654ddd896c245131185cabace555aadc9d86f6b06aa96892ba36aceca263ac181b"
    }
}

export const test_792 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x5beefcc4e98e5f876ef6e94a2291cde322e38d03",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 300
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 1,
            "dealer": 9,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "1000000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": true,
                    "isDealer": false,
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 1,
                        "action": "join",
                        "amount": "1000000000000000000",
                        "round": "ante",
                        "index": 1,
                        "timestamp": 1748406236197
                    },
                    "legalActions": [
                        {
                            "action": "post-small-blind",
                            "min": "10000000000000000",
                            "max": "10000000000000000",
                            "index": 2
                        },
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 2
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "[9S]-8D-10H-JC-8S-5C-JH-AS-4S-9H-5S-9D-JD-10S-7C-6S-QS-AH-3H-10D-6C-8C-KD-2D-5H-AC-4D-7D-7S-2C-5D-KH-QC-KC-9C-7H-10C-3C-3D-2S-JS-KS-6H-2H-4C-6D-QH-3S-QD-4H-AD-8H",
            "pots": [
                "0"
            ],
            "lastActedSeat": 1,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1748406236197
                }
            ],
            "round": "ante",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x8fc819041a693e9f8c01035ec4dec254f4ed744ba738ce8de9a53833e308794776fdb707c2562265f79272293cc74bd65aa3a23a66aa8994fa2bd2e574a50ac81c"
    }
}

export const test_870 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x485d3acabab7f00713d27bde1ea826a2963afe63",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 30000
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 2,
            "dealer": 9,
            "players": [
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "stack": "990000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "6D",
                        "10S"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 6
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "980000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "5S",
                        "KD"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 6
                        },
                        {
                            "action": "bet",
                            "min": "20000000000000000",
                            "max": "980000000000000000",
                            "index": 6
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "6D-5S-10S-KD-[2C]-JC-2S-8C-2D-8S-QS-3H-KH-QH-9H-5C-3S-5D-AD-7H-QD-AH-4C-3D-KS-JH-4D-7D-7S-JS-6S-KC-5H-7C-JD-4H-AC-6C-8D-3C-10D-9C-QC-4S-2H-9D-10C-AS-9S-6H-8H-10H",
            "pots": [
                "30000000000000000"
            ],
            "lastActedSeat": 1,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 2,
            "previousActions": [
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1749441489007
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1749441489007
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1749441489007
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1749441489007
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1749441489007
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xbfe95d0f5bbc6dd435085f69c842b8556dd80fc72d3d2b20ea1761395ad294870072d1712e56be7760596cd76c84eba81dcab529dd4002a7c79d3f0fad67fb0d1b"
    }
}

export const test_873 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xd8f7d91143321a1830c9996f1e4e0654ba455714",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 30000
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 1,
            "dealer": 1,
            "players": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "stack": "960000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "4D",
                        "10D"
                    ],
                    "status": "showing",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 1,
                        "action": "show",
                        "amount": "0",
                        "round": "showdown",
                        "index": 30,
                        "timestamp": 1749508347867
                    },
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "stack": "1040000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "6C",
                        "2H"
                    ],
                    "status": "folded",
                    "lastAction": {
                        "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                        "seat": 2,
                        "action": "show",
                        "amount": "0",
                        "round": "showdown",
                        "index": 29,
                        "timestamp": 1749508347867
                    },
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "QC",
                "3D",
                "KC",
                "AD",
                "9D"
            ],
            "deck": "4D-6C-10D-2H-6D-JC-2D-QC-3D-KC-8H-AD-5D-9D-[8D]-7D-JD-KD-5C-10S-QD-KS-AH-4H-5H-3H-7H-10H-6H-AS-JH-9H-3S-QS-QH-7S-KH-2S-5S-6S-JS-4S-3C-10C-9S-8S-9C-4C-7C-2C-8C-AC",
            "pots": [
                "80000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 17,
            "handNumber": 2,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 18,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 19,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 20,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "call",
                    "amount": "10000000000000000",
                    "round": "preflop",
                    "index": 21,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 22,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 23,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 24,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "bet",
                    "amount": "20000000000000000",
                    "round": "turn",
                    "index": 25,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "call",
                    "amount": "20000000000000000",
                    "round": "turn",
                    "index": 26,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "river",
                    "index": 27,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "river",
                    "index": 28,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "show",
                    "amount": "",
                    "round": "showdown",
                    "index": 29,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "show",
                    "amount": "",
                    "round": "showdown",
                    "index": 30,
                    "timestamp": 1749508347867
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "fold",
                    "amount": "",
                    "round": "end",
                    "index": 31,
                    "timestamp": 1749508347867
                }
            ],
            "round": "showdown",
            "winners": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "amount": "80000000000000000",
                    "cards": [
                        "4D",
                        "10D"
                    ],
                    "name": "Flush",
                    "description": "Flush, Ad High"
                }
            ],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x8b4d03f9a8fb7f06051a1c600632d7579f53df9406fa27e79477906fa8fbfa5f04c7aa04957a5c78ce81dbb395a236bbf7db6bac93b040656461eabdc2c43eec1b"
    }
}

export const test_873_2 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x8d488a55da78ce7646c1a1b69f6bf7924c50ad5b",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 30000
            },
            "smallBlindPosition": 2,
            "bigBlindPosition": 2,
            "dealer": 2,
            "players": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "stack": "940000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "QC",
                        "8H"
                    ],
                    "status": "folded",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 1,
                        "action": "show",
                        "amount": "0",
                        "round": "showdown",
                        "index": 45,
                        "timestamp": 1749526923659
                    },
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "stack": "1060000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "AD",
                        "7D"
                    ],
                    "status": "showing",
                    "lastAction": {
                        "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                        "seat": 2,
                        "action": "show",
                        "amount": "0",
                        "round": "showdown",
                        "index": 44,
                        "timestamp": 1749526923659
                    },
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "4D",
                "KC",
                "8D",
                "5D",
                "7S"
            ],
            "deck": "QC-AD-8H-7D-2D-JC-10H-4D-KC-8D-10D-5D-3D-7S-[9D]-AH-6D-KD-7C-7H-JD-5H-QD-2H-KH-AC-3H-6H-4H-9H-3S-5S-4S-JH-QH-9S-AS-2S-4C-6C-8S-6S-10C-10S-5C-8C-QS-9C-JS-KS-2C-3C",
            "pots": [
                "120000000000000000"
            ],
            "lastActedSeat": 1,
            "actionCount": 31,
            "handNumber": 3,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 32,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 33,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 34,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "call",
                    "amount": "10000000000000000",
                    "round": "preflop",
                    "index": 35,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 36,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 37,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 38,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "turn",
                    "index": 39,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "turn",
                    "index": 40,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "river",
                    "index": 41,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "bet",
                    "amount": "40000000000000000",
                    "round": "river",
                    "index": 42,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "call",
                    "amount": "40000000000000000",
                    "round": "river",
                    "index": 43,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "show",
                    "amount": "",
                    "round": "showdown",
                    "index": 44,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "show",
                    "amount": "",
                    "round": "showdown",
                    "index": 45,
                    "timestamp": 1749526923659
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "fold",
                    "amount": "",
                    "round": "end",
                    "index": 46,
                    "timestamp": 1749526923659
                }
            ],
            "round": "showdown",
            "winners": [
                {
                    "address": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "amount": "120000000000000000",
                    "cards": [
                        "AD",
                        "7D"
                    ],
                    "name": "Flush",
                    "description": "Flush, Ad High"
                }
            ],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x89376f9e60563b4bf04f42ccbe3d2579b0732ff4a9aa790fec56ffac75c443bb5a79864667dd1e69e41244c7a585d9d739da8f30d18f600e1272a2089624e4b21b"
    }
}

export const test_877 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x32a008ea98acb5e36a65ce73e16d3002db81f88e",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 30000
            },
            "smallBlindPosition": 2,
            "bigBlindPosition": 1,
            "dealer": 1,
            "players": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "stack": "1000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": true,
                    "status": "folded",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "stack": "980000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "status": "folded",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "[JC]-3D-QC-AS-3H-4H-5D-2D-9D-KC-AD-KD-JD-4D-QD-10H-6D-8D-7D-10D-2H-6H-7H-KH-AH-8H-9H-2S-5H-7C-3S-JH-QH-QS-10C-8C-8S-4S-6S-4C-7S-5S-KS-9S-9C-10S-JS-5C-3C-AC-6C-2C",
            "pots": [
                "0"
            ],
            "lastActedSeat": 2,
            "actionCount": 6,
            "handNumber": 2,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "fold",
                    "amount": "",
                    "round": "ante",
                    "index": 7,
                    "timestamp": 1749528390097
                },
                {
                    "playerId": "0x38829ceF964019C1E12e6CF36CAad5845B0F012d",
                    "seat": 2,
                    "action": "fold",
                    "amount": "",
                    "round": "ante",
                    "index": 8,
                    "timestamp": 1749528390097
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x3ba0a4b155e82bd4989c753ae7611543d82cbad555227c5e6e0820b004bfe3c024670b42cc1021ce5d456cfef20e0fab1e3342b1a1c0eea2928d194790317ee41b"
    }
}