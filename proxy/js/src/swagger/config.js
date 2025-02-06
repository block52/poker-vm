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
                url: process.env.NODE_ENV === 'production' 
                    ? "https://proxy.block52.xyz"
                    : "http://localhost:8080",
                description: process.env.NODE_ENV === 'production' ? "Production server" : "Local development"
            }
        ],
        components: {
            schemas: {
                Account: {
                    type: 'object',
                    properties: {
                        nonce: { type: 'integer' },
                        address: { type: 'string' },
                        balance: { type: 'string' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/swagger/routes/*.js'] // Path to your route files
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec; 