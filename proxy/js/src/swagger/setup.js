const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config");
const archiver = require("archiver");

const swaggerSetup = app => {
    const swaggerUiOptions = {
        customSiteTitle: "Block52 API Documentation",
        customfavIcon: "https://block52.xyz/favicon.ico",
        swaggerOptions: {
            persistAuthorization: true
        },
        customCss: `
            .swagger-ui .topbar .download-url-wrapper { display: none } 
            .swagger-ui .topbar { 
                padding: 10px 0;
                background-color: #1b1b1b;
            }
            
            .download-container {
                position: fixed;
                top: 10px;
                right: 20px;
                z-index: 1000;
            }
            
            .download-button {
                background-color: #49cc90;
                color: white !important;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                text-decoration: none;
                display: inline-block;
                font-family: sans-serif;
                font-size: 14px;
            }
            
            .download-button:hover {
                background-color: #41b883;
            }
        `,
        customHeaders: `
            <div class="download-container">
                <a href="/swagger.json" class="download-button" download="swagger.json">
                    ⬇️ Download Swagger
                </a>
            </div>
        `
    };

    // Serve swagger docs
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // Expose swagger.json endpoint
    app.get("/swagger.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    // Generate and download Postman collection with environment
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
                postmanCollection.item.push({
                    name: endpoint.summary || path,
                    request: {
                        method: method.toUpperCase(),
                        header: [],
                        url: {
                            raw: `{{baseUrl}}${path}`,
                            host: ["{{baseUrl}}"],
                            path: path.split("/").filter(p => p)
                        }
                    }
                });
            });
        });

        // Create environment file
        const environment = {
            name: "Block52 Environment",
            values: [
                {
                    key: "baseUrl",
                    value: "http://localhost:8080",
                    type: "default",
                    enabled: true
                }
            ]
        };

        // Create zip file
        const archive = archiver("zip");

        res.attachment("block52-postman.zip");
        archive.pipe(res);

        // Add collection and environment files to zip
        archive.append(JSON.stringify(postmanCollection, null, 2), { name: "Block52.postman_collection.json" });
        archive.append(JSON.stringify(environment, null, 2), { name: "Block52.postman_environment.json" });

        archive.finalize();
    });
};

module.exports = swaggerSetup;
