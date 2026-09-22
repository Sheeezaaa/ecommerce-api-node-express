import express from 'express';
import cors from 'cors';
import { createYoga, createSchema } from 'graphql-yoga';
import productRoutes from './modules/products/product.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';

export function createApp() {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json());

  // Mount GraphQL Yoga Endpoint (/graphql)
  // Provides GraphiQL interactive GUI in browser and handles GraphQL POST/GET queries
  const yoga = createYoga({
    schema: createSchema({
      typeDefs,
      resolvers,
    }),
    graphqlEndpoint: '/graphql',
    graphiql: true,
  });

  // Yoga handler integration with Express
  app.use('/graphql', yoga);

  // Health and System Overview endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'Daraz & Bazaar Modernized E-Commerce API',
      version: '1.0.0',
      status: 'healthy',
      architecture: 'RESTful + GraphQL Hybrid Architecture',
      documentation: {
        rest_products: '/api/v1/products',
        rest_orders: '/api/v1/orders',
        graphql_endpoint: '/graphql',
      },
      features: [
        'Strictly Noun-based REST URIs (/api/v1/products)',
        'Idempotent PUT updates & Idempotency-Key header on POST /orders',
        'Standardized JSON error schema (error_code, message, timestamp, details)',
        'Query parameter filtering (?category=electronics&minPrice=1000)',
        'Pagination (?page=1&limit=5)',
        'REST Field Selection (?fields=title,price) solving over-fetching',
        'GraphQL endpoint (/graphql) solving mobile banner payload waste',
      ],
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString() });
  });

  // Mount strictly Noun-based REST Modules
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/orders', orderRoutes);

  // 404 Route Not Found Middleware
  app.use(notFoundHandler);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
