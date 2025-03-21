const swaggerJSDoc = require("swagger-jsdoc");

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Block 52 Proxy API Documentation",
            version: "1.0.1",
            description: "Proxy calls to the RPC layer 2"
        },
        servers: [
            {
                url: process.env.NODE_ENV === "production" ? "https://proxy.block52.xyz" : "http://localhost:8080",
                description: process.env.NODE_ENV === "production" ? "Production server" : "Local development"
            }
        ],
        paths: {
            "/": {
                get: {
                    tags: ["Health"],
                    summary: "Health check endpoint",
                    responses: {
                        200: {
                            description: "Server is running"
                        }
                    }
                }
            },
            "/account/{id}": {
                get: {
                    tags: ["Account"],
                    summary: "Get account information",
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "Account address"
                        }
                    ],
                    responses: {
                        200: {
                            description: "Account details",
                            content: {
                                "application/json": {
                                    example: {
                                        nonce: 0,
                                        address: "0x123...",
                                        balance: "1000000000000000000"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/time": {
                get: {
                    tags: ["System"],
                    summary: "Get current server time",
                    responses: {
                        200: {
                            description: "Current Unix timestamp",
                            content: {
                                "application/json": {
                                    example: {
                                        time: 1677649200
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/tables": {
                get: {
                    tags: ["Tables"],
                    summary: "Get all available tables",
                    responses: {
                        200: {
                            description: "List of tables",
                            content: {
                                "application/json": {
                                    example: []
                                }
                            }
                        }
                    }
                }
            },
            "/table/{id}": {
                get: {
                    tags: ["Tables"],
                    summary: "Get specific table information",
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "Table ID"
                        }
                    ],
                    responses: {
                        200: {
                            description: "Table details"
                        }
                    }
                }
            },
            "/table/{id}/player/{seat}": {
                get: {
                    tags: ["Tables"],
                    summary: "Get player at specific seat",
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "Table ID"
                        },
                        {
                            name: "seat",
                            in: "path",
                            required: true,
                            schema: { type: "integer" },
                            description: "Seat number"
                        }
                    ],
                    responses: {
                        200: {
                            description: "Player details"
                        }
                    }
                }
            },
            "/nonce/{address}": {
                get: {
                    tags: ["Account"],
                    summary: "Get account nonce",
                    parameters: [
                        {
                            name: "address",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "Ethereum address"
                        }
                    ],
                    responses: {
                        200: {
                            description: "Account nonce and timestamp",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            nonce: {
                                                type: "integer",
                                                description: "Account nonce"
                                            },
                                            timestamp: {
                                                type: "integer",
                                                description: "Current Unix timestamp"
                                            }
                                        }
                                    },
                                    example: {
                                        nonce: 0,
                                        timestamp: 1677649200
                                    }
                                }
                            }
                        },
                        500: {
                            description: "Error getting nonce",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            error: {
                                                type: "string"
                                            },
                                            details: {
                                                type: "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/table/{tableId}/join": {
                post: {
                    tags: ["Tables"],
                    summary: "Join a table",
                    parameters: [
                        {
                            name: "tableId",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "Table ID"
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        address: { type: "string" },
                                        buyInAmount: { type: "string" },
                                        seat: { type: "integer" },
                                        signature: { type: "string" },
                                        publicKey: { type: "string" },
                                        nonce: { type: "string" }
                                    }
                                },
                                example: {
                                    address: "0x123...",
                                    buyInAmount: "1000000000000000000",
                                    seat: 1,
                                    signature: "0x456...",
                                    publicKey: "0x789...",
                                    nonce: "0"
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: "Successfully joined table"
                        }
                    }
                }
            }
        }
    },
    apis: ["./src/routes/*.js", "./src/swagger/routes/*.js"]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
