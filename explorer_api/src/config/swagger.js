const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'B52 Explorer API',
      version: '1.0.0',
      description: 'API documentation for the B52 Explorer',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3800}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/index.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);
module.exports = specs; 