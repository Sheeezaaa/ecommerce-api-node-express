import { createApp } from './app.js';

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Daraz & Bazaar E-Commerce Modernized API is Online `);
  console.log(`====================================================`);
  console.log(` Server URL:        http://localhost:${PORT}`);
  console.log(` REST Products API: http://localhost:${PORT}/api/v1/products`);
  console.log(` REST Orders API:   http://localhost:${PORT}/api/v1/orders`);
  console.log(` GraphQL & GraphiQL: http://localhost:${PORT}/graphql`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
