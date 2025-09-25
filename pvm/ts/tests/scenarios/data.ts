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
                    "deck": "2S-KH-3C-7C-3D-KC-4C-7S-TS-JD-TD-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-TC-AH-AS-TH-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
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
                    "deck": "2S-KH-3C-7C-3D-KC-4C-7S-TS-JD-TD-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-TC-AH-AS-TH-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
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
                "TS",
                "JD",
                "2D"
            ],
            "deck": "2S-KH-3C-7C-3D-KC-4C-7S-TS-JD-TD-2D-[2C]-6C-6S-QH-7D-9S-5D-7H-5H-8D-9D-JC-QS-8H-6H-KD-5C-AC-4D-JS-TC-AH-AS-TH-KS-8C-8S-JH-9C-3S-4H-4S-3H-6D-9H-5S-AD-QC-2H-QD",
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
                        "TD",
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
                "TC",
                "6D",
                "8H"
            ],
            "deck": "TD-5D-5C-5H-JC-AC-AH-7D-3C-TC-9S-6D-KS-8H-[2C]-QS-9H-AD-JS-6S-8C-TS-7C-KD-2D-7H-4H-5S-7S-9C-4C-8D-2H-2S-4S-3S-3D-QD-9D-4D-QH-AS-JH-QC-JD-6C-8S-3H-KH-6H-KC-TH",
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
                        "TD",
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

export const test_735_2 = {
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
            "deck": "2D-KC-QC-AH-[5S]-JD-AS-7D-JC-6D-AD-3D-JH-5D-8D-4D-KD-TD-9D-4S-7C-TH-3H-QD-4H-6H-2H-3S-6S-5H-7H-8H-2S-9H-KH-AC-QH-JS-4C-3C-9C-8S-KS-9S-7S-2C-QS-TS-5C-8C-6C-TC",
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
};

export const test_735_3 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xba4f7433706592b3724b90858cdce24dcbe80596",
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
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "stack": "900000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "2H",
                        "TH"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 52
                        },
                        {
                            "action": "check",
                            "min": "0",
                            "max": "0",
                            "index": 52
                        },
                        {
                            "action": "bet",
                            "min": "20000000000000000",
                            "max": "900000000000000000",
                            "index": 52
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "1060000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "KH",
                        "5C"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 2,
                        "action": "check",
                        "amount": "0",
                        "round": "flop",
                        "index": 51,
                        "timestamp": 1752262068160
                    },
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "KS",
                "TS",
                "JS"
            ],
            "deck": "2H-KH-TH-5C-QC-9S-AH-KS-TS-JS-[JD]-QD-QH-AD-8H-2D-8D-3D-2C-4H-4S-8C-5H-3S-7D-6S-5D-4D-6H-KD-AC-6C-4C-TD-KC-3H-9D-3C-JH-7H-AS-9H-TC-QS-6D-9C-JC-5S-8S-2S-7C-7S",
            "pots": [
                "40000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 45,
            "handNumber": 4,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 46,
                    "timestamp": 1752227551688
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 47,
                    "timestamp": 1752227551688
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 48,
                    "timestamp": 1752227551688
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "call",
                    "amount": "10000000000000000",
                    "round": "preflop",
                    "index": 49,
                    "timestamp": 1752227566665
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 50,
                    "timestamp": 1752261348132
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 51,
                    "timestamp": 1752262068160
                }
            ],
            "round": "flop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x17e526b10fafadfb0fc860a5b19181afadb9b9bf545bd57a3ad84729b7b62b314d49274c813d29e9a3fcb7a4f3e38faa230a31015dba9c8b942229b696b69fe51c"
    }
};

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
            "deck": "[9S]-8D-TH-JC-8S-5C-JH-AS-4S-9H-5S-9D-JD-TS-7C-6S-QS-AH-3H-TD-6C-8C-KD-2D-5H-AC-4D-7D-7S-2C-5D-KH-QC-KC-9C-7H-TC-3C-3D-2S-JS-KS-6H-2H-4C-6D-QH-3S-QD-4H-AD-8H",
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
                        "TS"
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
            "deck": "6D-5S-TS-KD-[2C]-JC-2S-8C-2D-8S-QS-3H-KH-QH-9H-5C-3S-5D-AD-7H-QD-AH-4C-3D-KS-JH-4D-7D-7S-JS-6S-KC-5H-7C-JD-4H-AC-6C-8D-3C-TD-9C-QC-4S-2H-9D-TC-AS-9S-6H-8H-TH",
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
                        "TD"
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
            "deck": "4D-6C-TD-2H-6D-JC-2D-QC-3D-KC-8H-AD-5D-9D-[8D]-7D-JD-KD-5C-TS-QD-KS-AH-4H-5H-3H-7H-TH-6H-AS-JH-9H-3S-QS-QH-7S-KH-2S-5S-6S-JS-4S-3C-TC-9S-8S-9C-4C-7C-2C-8C-AC",
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
                        "TD"
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
            "deck": "QC-AD-8H-7D-2D-JC-TH-4D-KC-8D-TD-5D-3D-7S-[9D]-AH-6D-KD-7C-7H-JD-5H-QD-2H-KH-AC-3H-6H-4H-9H-3S-5S-4S-JH-QH-9S-AS-2S-4C-6C-8S-6S-TC-TS-5C-8C-QS-9C-JS-KS-2C-3C",
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
            "deck": "[JC]-3D-QC-AS-3H-4H-5D-2D-9D-KC-AD-KD-JD-4D-QD-TH-6D-8D-7D-TD-2H-6H-7H-KH-AH-8H-9H-2S-5H-7C-3S-JH-QH-QS-TC-8C-8S-4S-6S-4C-7S-5S-KS-9S-9C-TS-JS-5C-3C-AC-6C-2C",
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

export const test_899 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x89dc1fa1f9a1efba25bb6f6b1444064d42071385",
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
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 1,
                    "stack": "990000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "2H",
                        "3H"
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
                            "action": "call",
                            "min": "10000000000000000",
                            "max": "10000000000000000",
                            "index": 8
                        },
                        {
                            "action": "raise",
                            "min": "30000000000000000",
                            "max": "990000000000000000",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 6,
                    "stack": "960000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "2H",
                        "3H"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 6,
                        "action": "bet",
                        "amount": "20000000000000000",
                        "round": "preflop",
                        "index": 7,
                        "timestamp": 1749687513167
                    },
                    "legalActions": [],
                    "sumOfBets": "20000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "1000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 2,
                        "action": "join",
                        "amount": "1000000000000000000",
                        "round": "preflop",
                        "index": 6,
                        "timestamp": 1749687513167
                    },
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "2H-TC-JH-4H-[JD]-8S-7S-9D-2D-3H-KC-QH-4C-4S-5H-AC-TD-4D-3D-6C-9C-2S-6D-QD-5S-8C-8D-KD-9S-6H-AH-9H-7C-KS-TS-5C-7D-QC-JS-3S-AD-8H-6S-7H-AS-JC-KH-2C-TH-QS-5D-3C",
            "pots": [
                "50000000000000000"
            ],
            "lastActedSeat": 6,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1749687513167
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 6,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1749687513167
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1749687513167
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 6,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1749687513167
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1749687513167
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1749687513167
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 6,
                    "action": "bet",
                    "amount": "20000000000000000",
                    "round": "preflop",
                    "index": 7,
                    "timestamp": 1749687513167
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xec7fa05bb6dde4bc38beec515c51c0809fa5c22d2ce46c30cbc71ed0eb174afe0919efc953980fda972cfdada898413bb66a48cb98892d6f4574403807257dee1b"
    }
}

export const test_899_2 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xb3b36d89cc03e1fb4cc4b83e495205f2d7203b7a",
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
            "bigBlindPosition": 8,
            "dealer": 9,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "960000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "3H",
                        "AC"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 1,
                        "action": "raise",
                        "amount": "30000000000000000",
                        "round": "preflop",
                        "index": 6,
                        "timestamp": 1749691597636
                    },
                    "legalActions": [],
                    "sumOfBets": "30000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 8,
                    "stack": "980000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "7H",
                        "9D"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 7
                        },
                        {
                            "action": "call",
                            "min": "30000000000000000",
                            "max": "30000000000000000",
                            "index": 7
                        },
                        {
                            "action": "raise",
                            "min": "30000000000000000",
                            "max": "980000000000000000",
                            "index": 7
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "3H-7H-AC-9D-[KC]-6S-TH-9C-QD-JH-KH-TC-4D-2H-5D-8H-KS-4S-6D-QH-TS-3S-JS-3D-6H-AH-2C-5H-2S-TD-QC-9H-7S-KD-6C-8S-5S-5C-7C-8D-AD-JC-8C-4H-3C-2D-QS-7D-4C-AS-JD-9S",
            "pots": [
                "60000000000000000"
            ],
            "lastActedSeat": 1,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 8,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1749691597636
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 8,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1749691597636
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1749691597636
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 8,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1749691597636
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1749691597636
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "raise",
                    "amount": "30000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1749691597636
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x52e4dce70fb8ae5c80cfbb77081602a97e88999ade046fa289d6418176ef9603718c5a90fcc5410b27ec78577c8ecc4d25c7d840e812d955e6725a754292417e1c"
    }
}

export const test_902 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xe53cf3311b2555c662a834534e71d047dcf22f72",
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
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "stack": "960000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 1,
                        "action": "raise",
                        "amount": "30000000000000000",
                        "round": "preflop",
                        "index": 6,
                        "timestamp": 1749690879270
                    },
                    "legalActions": [],
                    "sumOfBets": "30000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 2,
                    "stack": "980000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
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
                            "index": 7
                        },
                        {
                            "action": "call",
                            "min": "30000000000000000",
                            "max": "30000000000000000",
                            "index": 7
                        },
                        {
                            "action": "raise",
                            "min": "30000000000000000",
                            "max": "980000000000000000",
                            "index": 7
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "7H-TS-6D-5S-[AD]-TD-2H-9H-KC-QH-JC-4D-QC-3S-4C-9C-2S-6C-8D-5C-8H-TC-6S-7D-JD-3C-9S-7S-3D-9D-KD-TH-AC-2D-KS-6H-JS-QS-JH-7C-8S-8C-5H-KH-3H-2C-AS-AH-QD-4H-4S-5D",
            "pots": [
                "60000000000000000"
            ],
            "lastActedSeat": 1,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 2,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1749690879270
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1749690879270
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1749690879270
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1749690879270
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1749690879270
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 1,
                    "action": "raise",
                    "amount": "30000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1749690879270
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xc58e3e799f328953f4984b9413ff6a9bad5304ac84347d96dc2f26db9a10964f52a0c0f5240fb8de47466f449e3548c8f6b4833be96f756c86d63ca633d33e4c1c"
    }
}

export const test_913 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xda420f4667498f035dda48a6cd7930c66370a4e9",
            "gameOptions": {
                "minBuyIn": "10000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 9,
                "minPlayers": 2,
                "smallBlind": "10000000000000000",
                "bigBlind": "20000000000000000",
                "timeout": 30000
            },
            "smallBlindPosition": 3,
            "bigBlindPosition": 8,
            "dealer": 9,
            "players": [
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 8,
                    "stack": "950000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "AC",
                        "KC"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                        "seat": 8,
                        "action": "raise",
                        "amount": "30000000000000000",
                        "round": "preflop",
                        "index": 7,
                        "timestamp": 1749781520813
                    },
                    "legalActions": [],
                    "sumOfBets": "30000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 3,
                    "stack": "960000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "QS",
                        "AH"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 3,
                        "action": "raise",
                        "amount": "30000000000000000",
                        "round": "preflop",
                        "index": 6,
                        "timestamp": 1749781520813
                    },
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
                            "min": "20000000000000000",
                            "max": "960000000000000000",
                            "index": 8
                        },
                        {
                            "action": "call",
                            "min": "10000000000000000",
                            "max": "10000000000000000",
                            "index": 8
                        },
                        {
                            "action": "raise",
                            "min": "30000000000000000",
                            "max": "960000000000000000",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "30000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "AC-QS-KC-AH-[5D]-JD-4D-9D-7H-7S-QH-6S-7C-TC-JS-9C-KH-3C-QC-3H-6D-AS-9H-4S-4H-KS-TH-3D-6C-6H-2H-2S-5S-8S-JH-TD-8H-KD-TS-2C-9S-QD-JC-4C-AD-7D-5C-8C-3S-5H-2D-8D",
            "pots": [
                "90000000000000000"
            ],
            "lastActedSeat": 8,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 3,
            "previousActions": [
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 8,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1749781520813
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 3,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1749781520813
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 3,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1749781520813
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 8,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1749781520813
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 3,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1749781520813
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 3,
                    "action": "raise",
                    "amount": "30000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1749781520813
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 8,
                    "action": "raise",
                    "amount": "30000000000000000",
                    "round": "preflop",
                    "index": 7,
                    "timestamp": 1749781520813
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xb5f6b73f29486fc427c090d1c04ac7fac504db3195a22ea621644bf85cff001a2f2f0989a2a0a1da41e7d355c882419b1344a911c7c49061fd67ab101e2f70d41c"
    }
}

export const test_971 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xba4f7433706592b3724b90858cdce24dcbe80596",
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
                    "stack": "960000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "QC",
                        "JD"
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
                            "action": "bet",
                            "min": "20000000000000000",
                            "max": "960000000000000000",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "960000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "2S",
                        "9H"
                    ],
                    "status": "active",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "9D",
                "AC",
                "2H"
            ],
            "deck": "QC-2S-JD-9H-6H-3D-8D-9D-AC-2H-[KC]-AH-QH-TS-4H-7D-5D-JH-TH-QD-6D-6S-3S-5S-2C-KD-4S-JC-7S-TD-6C-5C-KS-TC-5H-7C-8S-8H-AD-8C-9C-3H-4C-4D-KH-AS-3C-QS-9S-JS-7H-2D",
            "pots": [
                "80000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1752203141031
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1752204581076
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1752204596075
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1752204611099
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1752204611099
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "raise",
                    "amount": "30000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1752204611099
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "call",
                    "amount": "20000000000000000",
                    "round": "preflop",
                    "index": 7,
                    "timestamp": 1752204611100
                }
            ],
            "round": "flop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x724cadca309c7b7337fc9f50151544e1ded66e9894d71818ff156c5ebac7c81201c6f998e27a4d38951aa5452ebffedc46bd67ad23660b70223785e5153ecc281c"
    }
}

export const test_949 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xfa359e3c734c84e294ef63174e260b1c14cdd8c0",
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
                    "stack": "980000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "8D",
                        "TC"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                        "seat": 1,
                        "action": "call",
                        "amount": "10000000000000000",
                        "round": "preflop",
                        "index": 6,
                        "timestamp": 1750646132637
                    },
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 8
                        },
                        {
                            "action": "call",
                            "min": "20000000000000000",
                            "max": "20000000000000000",
                            "index": 8
                        },
                        {
                            "action": "raise",
                            "min": "20000000000000000",
                            "max": "980000000000000000",
                            "index": 8
                        }
                    ],
                    "sumOfBets": "10000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "960000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "KH",
                        "4D"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 2,
                        "action": "raise",
                        "amount": "20000000000000000",
                        "round": "preflop",
                        "index": 7,
                        "timestamp": 1750646147632
                    },
                    "legalActions": [],
                    "sumOfBets": "20000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "8D-KH-TC-4D-[AC]-6D-9S-KS-9H-3C-JD-9D-4S-6H-6S-KD-2D-4H-JC-TD-8H-QH-7C-3S-3H-5D-8C-7H-8S-5H-QS-2C-2S-6C-5C-JS-AH-TH-AS-JH-9C-5S-KC-TS-4C-7D-3D-2H-AD-QC-7S-QD",
            "pots": [
                "60000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1750646072910
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1750646117645
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1750646117645
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1750646117645
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1750646117645
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "call",
                    "amount": "10000000000000000",
                    "round": "preflop",
                    "index": 6,
                    "timestamp": 1750646132637
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "raise",
                    "amount": "20000000000000000",
                    "round": "preflop",
                    "index": 7,
                    "timestamp": 1750646147632
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x553cd21a5bb1dfa28b8a2998c7e21cc90e74d39e71fad491bfbf8880d2c1dd3d284f60062460518532b8abd72df7d3209873a63181201d28532eff6a4909ddb91c"
    }
}

export const test_984 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0x3c76fe75fa09481a49cf1f6d3e46a12d69d44eeb",
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
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "stack": "1060000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "QC",
                        "JC"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 23
                        },
                        {
                            "action": "call",
                            "min": "20000000000000000",
                            "max": "20000000000000000",
                            "index": 23
                        },
                        {
                            "action": "raise",
                            "min": "20000000000000000",
                            "max": "1060000000000000000",
                            "index": 23
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "stack": "840000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "TS",
                        "9C"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 2,
                        "action": "bet",
                        "amount": "20000000000000000",
                        "round": "flop",
                        "index": 22,
                        "timestamp": 1752557973517
                    },
                    "legalActions": [],
                    "sumOfBets": "20000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "TD",
                "JH",
                "9H"
            ],
            "deck": "QC-TS-JC-9C-6S-2S-AC-TD-JH-9H-[8C]-JS-3S-8S-KS-8D-QS-2H-9S-AD-KD-QH-3C-5H-KH-4H-7C-KC-4S-5S-AS-6C-AH-4D-QD-8H-3D-4C-7D-6H-JD-2C-TC-5C-2D-7S-7H-TH-3H-6D-9D-5D",
            "pots": [
                "100000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 16,
            "handNumber": 2,
            "nextToAct": 1,
            "previousActions": [
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 17,
                    "timestamp": 1752557943573
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 18,
                    "timestamp": 1752557943573
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 19,
                    "timestamp": 1752557958538
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "raise",
                    "amount": "30000000000000000",
                    "round": "preflop",
                    "index": 20,
                    "timestamp": 1752557958538
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "call",
                    "amount": "20000000000000000",
                    "round": "preflop",
                    "index": 21,
                    "timestamp": 1752557958538
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "bet",
                    "amount": "20000000000000000",
                    "round": "flop",
                    "index": 22,
                    "timestamp": 1752557973517
                }
            ],
            "round": "flop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xaa6c890e9c9a0c24b87daf1e9d80e35ed59699279d1340de6ea4f5939d44852e5ab99c951c2daeb9801f0da21b07aa40d0e3017d14a63e875f73142b15da492a1b"
    }
}

export const test_1006 = {
    "id": "1",
    "result": {
        "data": {
            "type": "cash",
            "address": "0xdb2964c979f42e52ba1261fa3a786bb437317cf1",
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
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                        "seat": 1,
                        "action": "post-small-blind",
                        "amount": "10000000000000000",
                        "round": "ante",
                        "index": 4,
                        "timestamp": 1753235241895
                    },
                    "legalActions": [
                        {
                            "action": "deal",
                            "min": "0",
                            "max": "0",
                            "index": 6
                        }
                    ],
                    "sumOfBets": "10000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "stack": "980000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 2,
                        "action": "post-big-blind",
                        "amount": "20000000000000000",
                        "round": "ante",
                        "index": 5,
                        "timestamp": 1753235331830
                    },
                    "legalActions": [],
                    "sumOfBets": "20000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "stack": "1000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "status": "active",
                    "lastAction": {
                        "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                        "seat": 3,
                        "action": "join",
                        "amount": "1000000000000000000",
                        "round": "ante",
                        "index": 3,
                        "timestamp": 1753235241895
                    },
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
                }
            ],
            "communityCards": [],
            "deck": "[4S]-4C-2H-QH-3H-6S-7H-5S-9C-8S-TD-AH-TS-5H-8H-JH-KC-2C-2S-3C-4D-AD-7C-QD-5C-KD-2D-4H-JS-9H-7D-9S-8D-3D-5D-QS-QC-AC-AS-TC-6C-6D-7S-TH-KH-KS-JD-3S-6H-JC-9D-8C",
            "pots": [
                "30000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 3,
            "previousActions": [
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1753235196830
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1753235226852
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "join",
                    "amount": "1000000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1753235241895
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "10000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1753235241895
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "20000000000000000",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1753235331830
                }
            ],
            "round": "ante",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xbf01f13dd3c0346db8b9ab6f3ea719c05b566f29f5aee12e7cfeb53f944dad2d0ebd6bca8163aa0233c5eb0f471c504c79cfec0cfe08ddab495306e6a25f63fc1b"
    }
}

export const test_1103 = {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x6ccc2890cadc73b1711a60582111f4f05b72dc20",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 2,
            "bigBlindPosition": 3,
            "dealer": 1,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "stack": "700000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 4,
                        "action": "check",
                        "amount": "0",
                        "round": "flop",
                        "index": 48,
                        "timestamp": 1756872601801
                    },
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 49
                        },
                        {
                            "action": "check",
                            "min": "0",
                            "max": "0",
                            "index": 49
                        },
                        {
                            "action": "raise",
                            "min": "700000000000000000000",
                            "max": "700000000000000000000",
                            "index": 49
                        }
                    ],
                    "sumOfBets": "9500000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "stack": "9400000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "JS",
                        "6C"
                    ],
                    "status": "folded",
                    "lastAction": {
                        "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                        "seat": 3,
                        "action": "fold",
                        "amount": "0",
                        "round": "flop",
                        "index": 44,
                        "timestamp": 1756872556791
                    },
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 49
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 1,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": true,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "all-in",
                    "lastAction": {
                        "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                        "seat": 1,
                        "action": "all-in",
                        "amount": "10200000000000000000000",
                        "round": "flop",
                        "index": 42,
                        "timestamp": 1756872511770
                    },
                    "legalActions": [],
                    "sumOfBets": "10200000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "0",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "all-in",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 2,
                        "action": "all-in",
                        "amount": "9500000000000000000000",
                        "round": "flop",
                        "index": 43,
                        "timestamp": 1756872511770
                    },
                    "legalActions": [],
                    "sumOfBets": "9500000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "QH",
                "2S",
                "KH"
            ],
            "deck": "7H-JS-KS-KD-5S-6C-8S-JH-9S-7S-9D-QH-2S-KH-[7D]-TS-AH-4S-4C-AS-6S-8H-3D-JD-AD-QS-2D-8D-5D-6H-5C-3S-QC-3H-2H-QD-TH-6D-TD-9H-KC-TC-2C-7C-8C-4H-9C-JC-5H-AC-4D-3C",
            "pots": [
                "29900000000000000000000"
            ],
            "lastActedSeat": 4,
            "actionCount": 31,
            "handNumber": 2,
            "nextToAct": 4,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 32,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "post-big-blind",
                    "amount": "200000000000000000000",
                    "round": "ante",
                    "index": 33,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 34,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 35,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 1,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 36,
                    "timestamp": 1756872466782
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "fold",
                    "amount": "",
                    "round": "preflop",
                    "index": 37,
                    "timestamp": 1756872466782
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 38,
                    "timestamp": 1756872481776
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 39,
                    "timestamp": 1756872481776
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 40,
                    "timestamp": 1756872496755
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 41,
                    "timestamp": 1756872511770
                },
                {
                    "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 1,
                    "action": "all-in",
                    "amount": "10200000000000000000000",
                    "round": "flop",
                    "index": 42,
                    "timestamp": 1756872511770
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "all-in",
                    "amount": "9500000000000000000000",
                    "round": "flop",
                    "index": 43,
                    "timestamp": 1756872511770
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "fold",
                    "amount": "",
                    "round": "flop",
                    "index": 44,
                    "timestamp": 1756872556791
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "call",
                    "amount": "9500000000000000000000",
                    "round": "flop",
                    "index": 45,
                    "timestamp": 1756872571770
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 46,
                    "timestamp": 1756872571770
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 47,
                    "timestamp": 1756872586766
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 48,
                    "timestamp": 1756872601801
                }
            ],
            "round": "flop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xe9a138076d48264c498393bcf62d6cc43d2ae788fbeafebd1dba2fe84f4d5ebf42ed4f6067a92a03a79a491cedcaae77c38ed28e59b841ea8d91067b7f4d81dc1c"
    }
}

export const test_1103_modified = {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x6ccc2890cadc73b1711a60582111f4f05b72dc20",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 2,
            "bigBlindPosition": 3,
            "dealer": 1,
            "players": [
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "stack": "700000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                        "seat": 4,
                        "action": "check",
                        "amount": "0",
                        "round": "flop",
                        "index": 48,
                        "timestamp": 1756872601801
                    },
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 49
                        },
                        {
                            "action": "check",
                            "min": "0",
                            "max": "0",
                            "index": 49
                        },
                        {
                            "action": "raise",
                            "min": "700000000000000000000",
                            "max": "700000000000000000000",
                            "index": 49
                        }
                    ],
                    "sumOfBets": "9500000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "stack": "9400000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "JS",
                        "6C"
                    ],
                    "status": "folded",
                    "lastAction": {
                        "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                        "seat": 3,
                        "action": "fold",
                        "amount": "0",
                        "round": "flop",
                        "index": 44,
                        "timestamp": 1756872556791
                    },
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 49
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 1,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": true,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "all-in",
                    "lastAction": {
                        "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                        "seat": 1,
                        "action": "all-in",
                        "amount": "10200000000000000000000",
                        "round": "flop",
                        "index": 42,
                        "timestamp": 1756872511770
                    },
                    "legalActions": [],
                    "sumOfBets": "10200000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "0",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "all-in",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 2,
                        "action": "all-in",
                        "amount": "9500000000000000000000",
                        "round": "flop",
                        "index": 43,
                        "timestamp": 1756872511770
                    },
                    "legalActions": [],
                    "sumOfBets": "9500000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "QH",
                "2S",
                "KH"
            ],
            "deck": "7H-JS-KS-KD-5S-6C-8S-JH-9S-7S-9D-QH-2S-KH-[7D]-TS-AH-4S-4C-AS-6S-8H-3D-JD-AD-QS-2D-8D-5D-6H-5C-3S-QC-3H-2H-QD-TH-6D-TD-9H-KC-TC-2C-7C-8C-4H-9C-JC-5H-AC-4D-3C",
            "pots": [
                "29900000000000000000000"
            ],
            "lastActedSeat": 4,
            "actionCount": 31,
            "handNumber": 2,
            "nextToAct": 4,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 32,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "post-big-blind",
                    "amount": "200000000000000000000",
                    "round": "ante",
                    "index": 33,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 34,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 35,
                    "timestamp": 1756872451787
                },
                {
                    "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 1,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 36,
                    "timestamp": 1756872466782
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "fold",
                    "amount": "",
                    "round": "preflop",
                    "index": 37,
                    "timestamp": 1756872466782
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 38,
                    "timestamp": 1756872481776
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 39,
                    "timestamp": 1756872481776
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 40,
                    "timestamp": 1756872496755
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 41,
                    "timestamp": 1756872511770
                },
                {
                    "playerId": "0xc264FEDe83B081C089530BA0b8770C98266d058a",
                    "seat": 1,
                    "action": "all-in",
                    "amount": "10200000000000000000000",
                    "round": "flop",
                    "index": 42,
                    "timestamp": 1756872511770
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "all-in",
                    "amount": "9500000000000000000000",
                    "round": "flop",
                    "index": 43,
                    "timestamp": 1756872511770
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 3,
                    "action": "fold",
                    "amount": "",
                    "round": "flop",
                    "index": 44,
                    "timestamp": 1756872556791
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "call",
                    "amount": "9500000000000000000000",
                    "round": "flop",
                    "index": 45,
                    "timestamp": 1756872571770
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 46,
                    "timestamp": 1756872571770
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 47,
                    "timestamp": 1756872586766
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "flop",
                    "index": 48,
                    "timestamp": 1756872601801
                }
            ],
            "round": "flop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xe9a138076d48264c498393bcf62d6cc43d2ae788fbeafebd1dba2fe84f4d5ebf42ed4f6067a92a03a79a491cedcaae77c38ed28e59b841ea8d91067b7f4d81dc1c"
    }
}

export const test_1103_2 = {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x2618f85b62c618d37ac694e4dcd00689a8f473d9",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 3,
            "bigBlindPosition": 4,
            "dealer": 2,
            "players": [
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 1,
                    "stack": "22700000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 46
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 3,
                    "stack": "8500000000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 3,
                        "action": "post-small-blind",
                        "amount": "100000000000000000000",
                        "round": "ante",
                        "index": 45,
                        "timestamp": 1757474809572
                    },
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 46
                        }
                    ],
                    "sumOfBets": "100000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "stack": "8700000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": true,
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 46
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x228f76138259f398B95165115cF1180fe4BdBe92",
                    "seat": 4,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "post-big-blind",
                            "min": "200000000000000000000",
                            "max": "200000000000000000000",
                            "index": 46
                        },
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 46
                        },
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 46
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "[AH]-9H-QH-8D-TD-JS-5S-TH-2S-3H-JH-KH-6S-TS-2H-QD-8C-JD-KS-QC-7H-AC-4D-5C-6D-KD-2D-7D-8H-3S-6C-QS-9S-4S-AS-5D-KC-TC-9C-JC-3C-7C-8S-9D-3D-4C-7S-AD-4H-5H-2C-6H",
            "pots": [
                "100000000000000000000"
            ],
            "lastActedSeat": 3,
            "actionCount": 44,
            "handNumber": 3,
            "nextToAct": 4,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 3,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 45,
                    "timestamp": 1757474809572
                }
            ],
            "round": "ante",
            "winners": [],
            "results": [
                {
                    "place": 1,
                    "playerId": "0x228f76138259f398B95165115cF1180fe4BdBe92",
                    "payout": "3200000000000000000"
                }
            ],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x12afe9da36f48f91bdead381f024610423b0860f128005f0bf352191255ad57e0c0e5cde8c4d41f4241bfc105411da4ca37a7a66d5efcb01191bc3b2f14ed7691b"
    }
}

export const test_1120 = {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x0fbd9567e13b38593a38287123cb9bef3b2cfe67",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 2,
            "bigBlindPosition": 3,
            "dealer": 1,
            "players": [
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "stack": "8300000000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                        "seat": 2,
                        "action": "post-small-blind",
                        "amount": "100000000000000000000",
                        "round": "ante",
                        "index": 20,
                        "timestamp": 1758101290119
                    },
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 21
                        }
                    ],
                    "sumOfBets": "100000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 1,
                    "stack": "31600000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": true,
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 21
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 3,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "post-big-blind",
                            "min": "200000000000000000000",
                            "max": "200000000000000000000",
                            "index": 21
                        },
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 21
                        },
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 21
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "sit-out",
                            "min": "0",
                            "max": "0",
                            "index": 21
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "[4H]-JD-KS-9S-QH-8S-2H-JS-5C-2S-9D-QS-TH-6S-9C-7S-2D-AH-4S-7C-7D-8D-4C-TS-5D-6D-QC-2C-7H-JC-6H-AS-JH-5H-KD-TC-5S-3D-QD-KC-4D-6C-9H-3C-AD-3S-8C-8H-3H-KH-AC-TD",
            "pots": [
                "100000000000000000000"
            ],
            "lastActedSeat": 2,
            "actionCount": 19,
            "handNumber": 2,
            "nextToAct": 3,
            "previousActions": [
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 20,
                    "timestamp": 1758101290119
                }
            ],
            "round": "ante",
            "winners": [],
            "results": [
                {
                    "place": 4,
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "payout": "0"
                },
                {
                    "place": 3,
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "payout": "0"
                }
            ],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xd4d763fb48223155e2ef889bb1c9cad2d37324e1aa414fdc6ae04529db89bae068e3eda76100ce84254fd6051465071c7a88a249c105394c5b37bab3262904821b"
    }
}

export const test_1126 = {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x34753be1883c5bcb4f820bdc958a4852949d2695",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 3,
            "bigBlindPosition": 2,
            "dealer": 1,
            "players": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "9H",
                        "4S"
                    ],
                    "status": "all-in",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 2,
                        "action": "all-in",
                        "amount": "6200000000000000000000",
                        "round": "turn",
                        "index": 143,
                        "timestamp": 1758507332014
                    },
                    "legalActions": [],
                    "sumOfBets": "6200000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": true,
                    "holeCards": [
                        "AC",
                        "AH"
                    ],
                    "status": "all-in",
                    "lastAction": {
                        "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                        "seat": 1,
                        "action": "all-in",
                        "amount": "8600000000000000000000",
                        "round": "turn",
                        "index": 146,
                        "timestamp": 1758507347009
                    },
                    "legalActions": [],
                    "sumOfBets": "8600000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "stack": "1800000000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "3S",
                        "6C"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                        "seat": 3,
                        "action": "call",
                        "amount": "2400000000000000000000",
                        "round": "turn",
                        "index": 147,
                        "timestamp": 1758507362010
                    },
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 149
                        },
                        {
                            "action": "call",
                            "min": "-1800000000000000000000",
                            "max": "-1800000000000000000000",
                            "index": 149
                        },
                        {
                            "action": "raise",
                            "min": "1800000000000000000000",
                            "max": "1800000000000000000000",
                            "index": 149
                        }
                    ],
                    "sumOfBets": "8600000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "5D",
                        "9S"
                    ],
                    "status": "all-in",
                    "lastAction": {
                        "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                        "seat": 4,
                        "action": "all-in",
                        "amount": "600000000000000000000",
                        "round": "turn",
                        "index": 148,
                        "timestamp": 1758507362010
                    },
                    "legalActions": [],
                    "sumOfBets": "6800000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [
                "9C",
                "AS",
                "7H",
                "QS"
            ],
            "deck": "9H-AC-3S-5D-4S-AH-6C-9S-3H-JD-5S-2D-JS-4H-2H-KC-8H-TS-7D-6S-AD-9C-AS-7H-8D-QS-[TH]-JH-TD-6H-6D-9D-2S-8C-7C-QH-3D-5C-TC-KD-3C-KS-5H-QD-KH-4C-JC-4D-QC-2C-7S-8S",
            "pots": [
                "38200000000000000000000"
            ],
            "lastActedSeat": 4,
            "actionCount": 127,
            "handNumber": 6,
            "nextToAct": 3,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 128,
                    "timestamp": 1758505816908
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "post-big-blind",
                    "amount": "200000000000000000000",
                    "round": "ante",
                    "index": 129,
                    "timestamp": 1758505831908
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 130,
                    "timestamp": 1758505831908
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 131,
                    "timestamp": 1758505876930
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "raise",
                    "amount": "400000000000000000000",
                    "round": "preflop",
                    "index": 132,
                    "timestamp": 1758505876930
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "call",
                    "amount": "300000000000000000000",
                    "round": "preflop",
                    "index": 133,
                    "timestamp": 1758507181991
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 134,
                    "timestamp": 1758507181991
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 135,
                    "timestamp": 1758507197003
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "bet",
                    "amount": "800000000000000000000",
                    "round": "flop",
                    "index": 136,
                    "timestamp": 1758507197004
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "call",
                    "amount": "800000000000000000000",
                    "round": "flop",
                    "index": 137,
                    "timestamp": 1758507197004
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "call",
                    "amount": "800000000000000000000",
                    "round": "flop",
                    "index": 138,
                    "timestamp": 1758507211996
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "raise",
                    "amount": "1600000000000000000000",
                    "round": "flop",
                    "index": 139,
                    "timestamp": 1758507211996
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "call",
                    "amount": "800000000000000000000",
                    "round": "flop",
                    "index": 140,
                    "timestamp": 1758507316995
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "call",
                    "amount": "800000000000000000000",
                    "round": "flop",
                    "index": 141,
                    "timestamp": 1758507332014
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "call",
                    "amount": "800000000000000000000",
                    "round": "flop",
                    "index": 142,
                    "timestamp": 1758507332014
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 2,
                    "action": "all-in",
                    "amount": "6200000000000000000000",
                    "round": "turn",
                    "index": 143,
                    "timestamp": 1758507332014
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "call",
                    "amount": "6200000000000000000000",
                    "round": "turn",
                    "index": 144,
                    "timestamp": 1758507347009
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "call",
                    "amount": "6200000000000000000000",
                    "round": "turn",
                    "index": 145,
                    "timestamp": 1758507347009
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "action": "all-in",
                    "amount": "8600000000000000000000",
                    "round": "turn",
                    "index": 146,
                    "timestamp": 1758507347009
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "call",
                    "amount": "2400000000000000000000",
                    "round": "turn",
                    "index": 147,
                    "timestamp": 1758507362010
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "all-in",
                    "amount": "600000000000000000000",
                    "round": "turn",
                    "index": 148,
                    "timestamp": 1758507362010
                }
            ],
            "round": "turn",
            "winners": [],
            "results": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xd15d17d01894120bd88787ec7837e491050cef23e8834cfaec36d0baf20bfa4f24e9fb8b617bf8f6ca6706308fdf0664c9b838dd3dbd51e61c4905f4e189fb581c"
    }
}

export const test_1130 = {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x3e84becd6c9fec43f328b3f0001b14ed36c6efb4",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 4,
            "bigBlindPosition": 3,
            "dealer": 3,
            "players": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "stack": "9000000000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "3H",
                        "AD"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 4,
                        "action": "check",
                        "amount": "0",
                        "round": "preflop",
                        "index": 38,
                        "timestamp": 1758705325852
                    },
                    "legalActions": [],
                    "sumOfBets": "100000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "7S",
                        "2D"
                    ],
                    "status": "active",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "9D",
                        "KS"
                    ],
                    "status": "active",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "stack": "30600000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "2H",
                        "AS"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                        "seat": 3,
                        "action": "check",
                        "amount": "0",
                        "round": "preflop",
                        "index": 37,
                        "timestamp": 1758680275325
                    },
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 39
                        },
                        {
                            "action": "check",
                            "min": "0",
                            "max": "0",
                            "index": 39
                        },
                        {
                            "action": "raise",
                            "min": "200000000000000000000",
                            "max": "30600000000000000000000",
                            "index": 39
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "3H-7S-9D-2H-AD-2D-KS-AS-7D-9H-3D-QS-4S-TH-5H-QH-KC-8D-[3C]-8S-JC-2S-3S-9S-TD-5D-8H-AC-QD-QC-9C-4D-7H-2C-JS-6S-8C-6D-AH-KD-4H-7C-5S-5C-6C-JD-6H-TS-4C-JH-TC-KH",
            "pots": [
                "400000000000000000000"
            ],
            "lastActedSeat": 4,
            "actionCount": 22,
            "handNumber": 2,
            "nextToAct": 3,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 23,
                    "timestamp": 1758680140318
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "post-big-blind",
                    "amount": "200000000000000000000",
                    "round": "ante",
                    "index": 24,
                    "timestamp": 1758680155326
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 25,
                    "timestamp": 1758680155326
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "call",
                    "amount": "100000000000000000000",
                    "round": "preflop",
                    "index": 26,
                    "timestamp": 1758680155326
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 27,
                    "timestamp": 1758680170318
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 28,
                    "timestamp": 1758680170318
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 29,
                    "timestamp": 1758680185318
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 30,
                    "timestamp": 1758680200317
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 31,
                    "timestamp": 1758680215322
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 32,
                    "timestamp": 1758680245323
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 33,
                    "timestamp": 1758680245323
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 34,
                    "timestamp": 1758680260329
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 35,
                    "timestamp": 1758680260329
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 36,
                    "timestamp": 1758680260329
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 37,
                    "timestamp": 1758680275325
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "check",
                    "amount": "",
                    "round": "preflop",
                    "index": 38,
                    "timestamp": 1758705325852
                }
            ],
            "round": "preflop",
            "winners": [],
            "results": [
                {
                    "place": 4,
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "payout": "0"
                },
                {
                    "place": 3,
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "payout": "0"
                }
            ],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x62809e766b21a87134618c4135a532e23fb4600859d4f5c818b358ee633baff04fc41470e3b031a889b64a4b43fe4e0086eab5d2a5c6b393c1aa143590966f851b"
    }
}

export const test_1130_edited = {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x3e84becd6c9fec43f328b3f0001b14ed36c6efb4",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 4,
            "bigBlindPosition": 3,
            "dealer": 3,
            "players": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "stack": "9000000000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "3H",
                        "AD"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                        "seat": 4,
                        "action": "check",
                        "amount": "0",
                        "round": "preflop",
                        "index": 38,
                        "timestamp": 1758705325852
                    },
                    "legalActions": [],
                    "sumOfBets": "100000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 1,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "7S",
                        "2D"
                    ],
                    "status": "active",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "stack": "0",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "9D",
                        "KS"
                    ],
                    "status": "active",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "stack": "30600000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": true,
                    "holeCards": [
                        "2H",
                        "AS"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                        "seat": 3,
                        "action": "check",
                        "amount": "0",
                        "round": "preflop",
                        "index": 37,
                        "timestamp": 1758680275325
                    },
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 39
                        },
                        {
                            "action": "check",
                            "min": "0",
                            "max": "0",
                            "index": 39
                        },
                        {
                            "action": "raise",
                            "min": "200000000000000000000",
                            "max": "30600000000000000000000",
                            "index": 39
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "3H-7S-9D-2H-AD-2D-KS-AS-7D-9H-3D-QS-4S-TH-5H-QH-KC-8D-[3C]-8S-JC-2S-3S-9S-TD-5D-8H-AC-QD-QC-9C-4D-7H-2C-JS-6S-8C-6D-AH-KD-4H-7C-5S-5C-6C-JD-6H-TS-4C-JH-TC-KH",
            "pots": [
                "400000000000000000000"
            ],
            "lastActedSeat": 4,
            "actionCount": 22,
            "handNumber": 2,
            "nextToAct": 3,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 23,
                    "timestamp": 1758680140318
                },
                {
                    "playerId": "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD",
                    "seat": 3,
                    "action": "post-big-blind",
                    "amount": "200000000000000000000",
                    "round": "ante",
                    "index": 24,
                    "timestamp": 1758680155326
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 25,
                    "timestamp": 1758680155326
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 4,
                    "action": "call",
                    "amount": "100000000000000000000",
                    "round": "preflop",
                    "index": 26,
                    "timestamp": 1758680155326
                }
            ],
            "round": "preflop",
            "winners": [],
            "results": [
                {
                    "place": 4,
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "payout": "0"
                },
                {
                    "place": 3,
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "payout": "0"
                }
            ],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0x62809e766b21a87134618c4135a532e23fb4600859d4f5c818b358ee633baff04fc41470e3b031a889b64a4b43fe4e0086eab5d2a5c6b393c1aa143590966f851b"
    }
}

export const test_1111= {
    "id": "1",
    "result": {
        "data": {
            "type": "sit-and-go",
            "address": "0x4957e048d6468e06034d3eafc74d612033787d13",
            "gameOptions": {
                "minBuyIn": "1000000000000000000",
                "maxBuyIn": "1000000000000000000",
                "maxPlayers": 4,
                "minPlayers": 4,
                "smallBlind": "100000000000000000000",
                "bigBlind": "200000000000000000000",
                "timeout": 300000,
                "type": "sit-and-go"
            },
            "smallBlindPosition": 1,
            "bigBlindPosition": 2,
            "dealer": 4,
            "players": [
                {
                    "address": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "stack": "9900000000000000000000",
                    "isSmallBlind": true,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 3,
                    "stack": "9800000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "lastAction": {
                        "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                        "seat": 3,
                        "action": "call",
                        "amount": "200000000000000000000",
                        "round": "preflop",
                        "index": 8,
                        "timestamp": 1757291218029
                    },
                    "legalActions": [],
                    "sumOfBets": "200000000000000000000",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "stack": "10000000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": false,
                    "isDealer": true,
                    "holeCards": [
                        "6H",
                        "JD"
                    ],
                    "status": "active",
                    "legalActions": [
                        {
                            "action": "fold",
                            "min": "0",
                            "max": "0",
                            "index": 9
                        },
                        {
                            "action": "call",
                            "min": "200000000000000000000",
                            "max": "200000000000000000000",
                            "index": 9
                        },
                        {
                            "action": "raise",
                            "min": "400000000000000000000",
                            "max": "10000000000000000000000",
                            "index": 9
                        }
                    ],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                    "address": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "stack": "9800000000000000000000",
                    "isSmallBlind": false,
                    "isBigBlind": true,
                    "isDealer": false,
                    "holeCards": [
                        "??",
                        "??"
                    ],
                    "status": "active",
                    "legalActions": [],
                    "sumOfBets": "0",
                    "timeout": 0,
                    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
                }
            ],
            "communityCards": [],
            "deck": "AH-2D-6H-5D-JS-AC-JD-4H-[4D]-8H-QC-KS-JC-QD-9H-2S-7H-AS-5S-QH-5C-3C-KH-6D-4C-9S-6C-4S-9C-8D-KD-AD-3D-7C-9D-TH-TS-5H-6S-3S-7D-2C-KC-TD-8C-JH-2H-3H-QS-TC-7S-8S",
            "pots": [
                "500000000000000000000"
            ],
            "lastActedSeat": 3,
            "actionCount": 0,
            "handNumber": 1,
            "nextToAct": 4,
            "previousActions": [
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "join",
                    "amount": "10000000000000000000000",
                    "round": "ante",
                    "index": 1,
                    "timestamp": 1757290438029
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 3,
                    "action": "join",
                    "amount": "10000000000000000000000",
                    "round": "ante",
                    "index": 2,
                    "timestamp": 1757290468036
                },
                {
                    "playerId": "0x4260E88e81E60113146092Fb9474b61C59f7552e",
                    "seat": 4,
                    "action": "join",
                    "amount": "10000000000000000000000",
                    "round": "ante",
                    "index": 3,
                    "timestamp": 1757290513038
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "join",
                    "amount": "10000000000000000000000",
                    "round": "ante",
                    "index": 4,
                    "timestamp": 1757290513038
                },
                {
                    "playerId": "0xC84737526E425D7549eF20998Fa992f88EAC2484",
                    "seat": 1,
                    "action": "post-small-blind",
                    "amount": "100000000000000000000",
                    "round": "ante",
                    "index": 5,
                    "timestamp": 1757290513038
                },
                {
                    "playerId": "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C",
                    "seat": 2,
                    "action": "post-big-blind",
                    "amount": "200000000000000000000",
                    "round": "ante",
                    "index": 6,
                    "timestamp": 1757291023009
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 3,
                    "action": "deal",
                    "amount": "",
                    "round": "ante",
                    "index": 7,
                    "timestamp": 1757291218029
                },
                {
                    "playerId": "0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8",
                    "seat": 3,
                    "action": "call",
                    "amount": "200000000000000000000",
                    "round": "preflop",
                    "index": 8,
                    "timestamp": 1757291218029
                }
            ],
            "round": "preflop",
            "winners": [],
            "signature": "0x0000000000000000000000000000000000000000000000000000000000000000"
        },
        "signature": "0xbc6da179d36ad465813eef0b5622484e796bbf10af9449191ed92fd0652c598a0ee2746bcee3de8ccb53b01778005310e96f5913af642d777981949f2194f3181c"
    }
}
