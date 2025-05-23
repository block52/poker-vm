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