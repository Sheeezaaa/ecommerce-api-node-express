import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { store } from '../src/data/store.js';

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    // Listen on random available port
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  store.reset();
});

describe('Module 1: RESTful Architecture & Resource Modeling', () => {
  test('GET /api/v1/products - Returns 200 with paginated product list', async () => {
    const res = await fetch(`${baseUrl}/api/v1/products`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 5);
    assert.equal(body.pagination.total, 5);
    assert.equal(body.pagination.page, 1);
  });

  test('GET /api/v1/products?category=electronics&limit=1 - Filters by category and limits page size', async () => {
    const res = await fetch(`${baseUrl}/api/v1/products?category=electronics&limit=1&page=1`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].category, 'electronics');
    assert.equal(body.pagination.total, 2);
    assert.equal(body.pagination.totalPages, 2);
    assert.equal(body.pagination.hasNextPage, true);
  });

  test('POST /api/v1/products - Creates a product with 201 Created and Location header', async () => {
    const newProduct = {
      title: 'Audionic Airbud 425 Wireless Earbuds',
      price: 4999.0,
      category: 'electronics',
      brand: 'Audionic',
      stock: 50,
      description: 'ENC Quad Mic with deep bass sound signature.',
    };

    const res = await fetch(`${baseUrl}/api/v1/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });

    assert.equal(res.status, 201);
    assert.ok(res.headers.get('Location').includes('/api/v1/products/'));

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.title, newProduct.title);
    assert.equal(body.data.price, 4999.0);
    assert.ok(body.data.id);
  });

  test('PUT /api/v1/products/:id - Idempotent update returns identical state on repeated calls', async () => {
    const updatePayload = {
      title: 'Samsung 55" Crystal 4K UHD Smart TV (2026 Refresh)',
      price: 145000.0,
      category: 'electronics',
      brand: 'Samsung',
      stock: 30,
      description: 'Updated description for refreshed model.',
    };

    // First PUT call
    const res1 = await fetch(`${baseUrl}/api/v1/products/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.title, updatePayload.title);
    assert.equal(body1.data.price, 145000.0);

    // Second identical PUT call (Idempotency verification)
    const res2 = await fetch(`${baseUrl}/api/v1/products/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.title, body1.data.title);
    assert.equal(body2.data.price, body1.data.price);
    assert.equal(body2.data.stock, body1.data.stock);
  });

  test('DELETE /api/v1/products/:id - Deletes resource idempotently', async () => {
    // Delete existing product
    const res1 = await fetch(`${baseUrl}/api/v1/products/5`, {
      method: 'DELETE',
    });
    assert.equal(res1.status, 200);

    // Verify it is gone
    const res2 = await fetch(`${baseUrl}/api/v1/products/5`);
    assert.equal(res2.status, 404);
  });
});

describe('Module 2: Standardized JSON Error Schema & Status Codes', () => {
  test('POST /api/v1/products - Returns 400 Bad Request with standardized error schema on validation failure', async () => {
    const invalidPayload = {
      // Missing title
      price: -50, // Invalid negative price
      // Missing category
    };

    const res = await fetch(`${baseUrl}/api/v1/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    assert.equal(res.status, 400);
    const errorBody = await res.json();

    // Check standardized schema: success, error_code, message, timestamp, details
    assert.equal(errorBody.success, false);
    assert.equal(errorBody.error_code, 'VALIDATION_FAILED');
    assert.ok(errorBody.message);
    assert.ok(errorBody.timestamp);
    assert.ok(Array.isArray(errorBody.details));
    assert.ok(errorBody.details.some((d) => d.field === 'title'));
    assert.ok(errorBody.details.some((d) => d.field === 'price'));
    assert.ok(errorBody.details.some((d) => d.field === 'category'));
  });

  test('GET /api/v1/products/9999 - Returns 404 Not Found with standardized error schema', async () => {
    const res = await fetch(`${baseUrl}/api/v1/products/9999`);
    assert.equal(res.status, 404);

    const errorBody = await res.json();
    assert.equal(errorBody.success, false);
    assert.equal(errorBody.error_code, 'PRODUCT_NOT_FOUND');
    assert.equal(errorBody.message, 'Product with ID 9999 not found');
    assert.ok(errorBody.timestamp);
  });

  test('GET /unknown/route - Returns 404 ROUTE_NOT_FOUND with standardized schema', async () => {
    const res = await fetch(`${baseUrl}/unknown/route`);
    assert.equal(res.status, 404);

    const errorBody = await res.json();
    assert.equal(errorBody.success, false);
    assert.equal(errorBody.error_code, 'ROUTE_NOT_FOUND');
    assert.ok(errorBody.timestamp);
  });
});

describe('Module 1 (Bonus): Idempotent Order Creation with Idempotency-Key Header', () => {
  test('POST /api/v1/orders - Prevents duplicate deductions when request is replayed with same key', async () => {
    const orderPayload = {
      customerId: 'CUST-DARAZ-99',
      items: [{ productId: '3', quantity: 2 }],
      paymentMethod: 'EASYPAISA',
    };

    const idempotencyKey = 'unique-checkout-token-abc-123';

    // Initial stock of product 3 (rice) is 250
    const initialProductRes = await fetch(`${baseUrl}/api/v1/products/3`);
    const initialProduct = await initialProductRes.json();
    assert.equal(initialProduct.data.stock, 250);

    // First attempt: Places order
    const res1 = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });
    assert.equal(res1.status, 201);
    const body1 = await res1.json();
    const orderId1 = body1.data.id;

    // Stock should now be 248
    const midProductRes = await fetch(`${baseUrl}/api/v1/products/3`);
    const midProduct = await midProductRes.json();
    assert.equal(midProduct.data.stock, 248);

    // Second attempt: Network retry with the SAME Idempotency-Key
    const res2 = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    // Should return 201 with identical cached payload and Idempotent-Replayed header
    assert.equal(res2.status, 201);
    assert.equal(res2.headers.get('Idempotent-Replayed'), 'true');
    const body2 = await res2.json();
    assert.equal(body2.data.id, orderId1);

    // Stock MUST still be 248 (NO duplicate inventory deduction or duplicate order!)
    const finalProductRes = await fetch(`${baseUrl}/api/v1/products/3`);
    const finalProduct = await finalProductRes.json();
    assert.equal(finalProduct.data.stock, 248);
  });
});

describe('Module 3: Over-Fetching Solutions (REST Field Selection & GraphQL)', () => {
  test('REST Field Selection: GET /api/v1/products/1?fields=title,price returns ONLY requested fields', async () => {
    // Normal request returns full ~50 fields
    const fullRes = await fetch(`${baseUrl}/api/v1/products/1`);
    const fullBody = await fullRes.json();
    assert.ok(fullBody.data.description);
    assert.ok(fullBody.data.vendor);
    assert.ok(fullBody.data.shipping);
    assert.ok(fullBody.data.specifications);

    // Filtered request for mobile banner
    const filteredRes = await fetch(`${baseUrl}/api/v1/products/1?fields=title,price`);
    assert.equal(filteredRes.status, 200);
    const filteredBody = await filteredRes.json();

    assert.equal(filteredBody.success, true);
    assert.ok(filteredBody.data.title);
    assert.ok(filteredBody.data.price);
    // Heavy fields must be omitted
    assert.equal(filteredBody.data.description, undefined);
    assert.equal(filteredBody.data.vendor, undefined);
    assert.equal(filteredBody.data.shipping, undefined);
    assert.equal(filteredBody.data.specifications, undefined);
  });

  test('GraphQL Query: POST /graphql solves mobile banner over-fetching', async () => {
    const bannerQuery = {
      query: `
        query GetBannerProduct {
          product(id: "1") {
            title
            price
          }
        }
      `,
    };

    const res = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerQuery),
    });

    assert.equal(res.status, 200);
    const result = await res.json();

    assert.ok(result.data.product);
    assert.equal(result.data.product.title, 'Samsung 55" Crystal 4K UHD Smart TV');
    assert.equal(result.data.product.price, 139999);
    // Ensures strictly no other fields leaked
    assert.deepEqual(Object.keys(result.data.product).sort(), ['price', 'title']);
  });

  test('GraphQL Query: POST /graphql with pagination and filters', async () => {
    const listQuery = {
      query: `
        query GetElectronics {
          products(category: "electronics", limit: 2) {
            total
            page
            limit
            data {
              id
              title
              price
              stock
            }
          }
        }
      `,
    };

    const res = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listQuery),
    });

    assert.equal(res.status, 200);
    const result = await res.json();
    assert.equal(result.data.products.total, 2);
    assert.equal(result.data.products.data.length, 2);
    assert.ok(result.data.products.data[0].title);
  });
});
