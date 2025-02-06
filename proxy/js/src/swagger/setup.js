const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config");

const swaggerSetup = (app) => {
    // Serve Swagger documentation
    app.use("/docs", swaggerUi.serve);
    app.get("/docs", swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "Block 52 API Documentation"
    }));

    // Optional: Expose swagger.json endpoint
    app.get("/swagger.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
};

module.exports = swaggerSetup; 