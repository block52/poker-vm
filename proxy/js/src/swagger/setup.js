const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config");
const fs = require('fs');
const path = require('path');

const swaggerSetup = (app) => {
    // Serve Swagger documentation
    app.use("/docs", swaggerUi.serve);
    app.get("/docs", swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "Block 52 API Documentation"
    }));

    // Expose swagger.json endpoint
    app.get("/swagger.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    // Generate Postman collection
    app.get("/postman-collection", (req, res) => {
        const postmanCollection = {
            info: {
                name: "Block52 API",
                description: "Block52 Proxy API Collection",
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            item: []
        };

        // Convert OpenAPI paths to Postman format
        Object.keys(swaggerSpec.paths).forEach(path => {
            const methods = swaggerSpec.paths[path];
            Object.keys(methods).forEach(method => {
                const endpoint = methods[method];
                const postmanRequest = {
                    name: endpoint.summary || path,
                    request: {
                        method: method.toUpperCase(),
                        header: [],
                        url: {
                            raw: `{{baseUrl}}${path}`,
                            host: ["{{baseUrl}}"],
                            path: path.split('/').filter(p => p)
                        }
                    }
                };

                // Add query parameters if they exist
                if (endpoint.parameters) {
                    const queryParams = endpoint.parameters.filter(p => p.in === 'query');
                    if (queryParams.length > 0) {
                        postmanRequest.request.url.query = queryParams.map(p => ({
                            key: p.name,
                            value: "",
                            description: p.description,
                            disabled: !p.required
                        }));
                    }
                }

                // Add request body if it exists
                if (endpoint.requestBody) {
                    postmanRequest.request.body = {
                        mode: 'raw',
                        raw: JSON.stringify(endpoint.requestBody.content['application/json']?.example || {}, null, 2),
                        options: {
                            raw: {
                                language: 'json'
                            }
                        }
                    };
                }

                postmanCollection.item.push(postmanRequest);
            });
        });

        // Add environment variables
        const environment = {
            name: "Block52 Environment",
            values: [
                {
                    key: "baseUrl",
                    value: "http://localhost:8080",
                    type: "default"
                }
            ]
        };

        // Create a zip file containing both collection and environment
        const zip = require('adm-zip')();
        zip.addFile('Block52.postman_collection.json', Buffer.from(JSON.stringify(postmanCollection, null, 2)));
        zip.addFile('Block52.postman_environment.json', Buffer.from(JSON.stringify(environment, null, 2)));

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=Block52-Postman.zip');
        res.send(zip.toBuffer());
    });
};

module.exports = swaggerSetup; 