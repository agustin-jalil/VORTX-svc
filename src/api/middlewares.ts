// src/api/middlewares.ts
import { defineMiddlewares } from '@medusajs/medusa';

export default defineMiddlewares({
  routes: [
    {
      matcher: '/store/firebase-*',
      middlewares: [
        (req, res, next) => {
          const origin = req.headers.origin;
          const storeCors = process.env.STORE_CORS;
          const allowedOrigins = storeCors.split(',').map(o => o.trim());

          // Permitir el origen si está en la lista
          if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          }

          // Headers permitidos
          res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, PATCH, DELETE, OPTIONS'
          );
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Requested-With, x-publishable-api-key'
          );
          res.setHeader('Access-Control-Max-Age', '86400');

          // Manejar preflight request
          if (req.method === 'OPTIONS') {
            return res.status(200).end();
          }

          return;
        }
      ]
    }
  ]
});
