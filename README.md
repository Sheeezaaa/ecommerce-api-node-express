# 🛒 Enterprise E-Commerce API Modernization (Daraz / Bazaar Analogy)

> **Lab Assignment 03 — Modern Backend & API Architecture**  
> Built with Node.js, Express, and GraphQL Yoga. Fully adheres to RESTful pillars, proper HTTP verbs, idempotent operations, standardized JSON error schemas, and over-fetching solutions.

---

## 📌 Table of Contents
1. [Business Context & Problem Statement](#-business-context--problem-statement)
2. [Key Architectural Solutions](#-key-architectural-solutions)
3. [Project Structure](#-project-structure)
4. [Quickstart & Installation](#-quickstart--installation)
5. [Module 1: RESTful Architecture & Resource Modeling](#-module-1-restful-architecture--resource-modeling)
6. [Module 2: Standardized Error Schema & Status Codes](#-module-2-standardized-error-schema--status-codes)
7. [Module 3: Over-Fetching Solution (REST Field Selection & GraphQL)](#-module-3-over-fetching-solution-rest-field-selection--graphql)
8. [Bonus Enterprise Feature: Network Retry Idempotency](#-bonus-enterprise-feature-network-retry-idempotency)
9. [Automated Verification & Test Suite](#-automated-verification--test-suite)
10. [cURL Testing Commands](#-curl-testing-commands)

---

## 🛒 Business Context & Problem Statement

Fast-growing e-commerce platforms (such as Daraz or Bazaar Technologies) face significant backend scaling challenges when mobile app clients interact with legacy architectures:

1. **Unstandardized URIs & Server Crashes**: Endpoints used non-RESTful verb-in-URI names (e.g., `/getProductsList`, `/deleteProductItem`). Client validation errors triggered raw 500 stack traces, causing mobile app crashes.
2. **Duplicate Orders & Deductions**: Network dropped requests prompted mobile apps to retry checkout calls. Because operations were non-idempotent, users were charged twice and duplicate orders were placed.
3. **The REST Over-Fetching Dilemma**: For the mobile home screen banner (which only displays **Title** and **Price**), hitting `/api/v1/products/1` returned an entire **50-field JSON object** (heavy descriptions, vendor tax IDs, warehouse coordinates, dimensional specs). This drained mobile battery and cellular data.

---

## 🚀 Key Architectural Solutions

| Problem | Legacy Anti-Pattern | Modernized Solution |
| :--- | :--- | :--- |
| **Endpoint Naming** | `/getProductsList`, `/deleteProductItem` | Strictly **Noun-based** REST URIs: `/api/v1/products` |
| **HTTP Verbs** | POST for everything | Proper semantic verbs: `GET`, `POST`, `PUT`, `DELETE` |
| **Server Crashes** | Uncaught exceptions / Raw 500 | Centralized error handler returning uniform JSON schema with safe 500s |
| **Duplicate Orders** | Repeated POST creates duplicates | `PUT` idempotency + `Idempotency-Key` header on `/api/v1/orders` |
| **Over-Fetching** | Monolithic 50-field payload | REST field selector (`?fields=title,price`) + **GraphQL endpoint** (`/graphql`) |

---

## 📂 Project Structure

```
API WE/
├── package.json                   # Project metadata, ES modules, scripts
├── src/
│   ├── app.js                     # Express app setup, GraphQL & REST mounting
│   ├── server.js                  # Entry point listening on port 3000
│   ├── config/
│   │   └── constants.js           # HTTP status codes, error codes, defaults
│   ├── data/
│   │   ├── initialProducts.js     # Heavy 50-field catalog (electronics, groceries, etc.)
│   │   └── store.js               # In-memory data store with thread-safe atomic methods
│   ├── errors/
│   │   └── AppError.js            # Custom error hierarchy (BadRequest, NotFound, Conflict)
│   ├── middlewares/
│   │   ├── errorHandler.js        # Centralized standardized JSON error middleware
│   │   ├── notFound.js            # 404 handler for non-existent routes
│   │   ├── validate.js            # Higher-order request body validator
│   │   └── idempotency.js         # Idempotency-Key cache & lock for retries
│   ├── modules/
│   │   ├── products/
│   │   │   ├── product.controller.js
│   │   │   ├── product.routes.js     # /api/v1/products (GET, POST, PUT, DELETE)
│   │   │   ├── product.service.js
│   │   │   └── product.validation.js # Field validation rules
│   │   └── orders/
│   │       ├── order.controller.js
│   │       └── order.routes.js       # /api/v1/orders with Idempotency-Key
│   ├── graphql/
│   │   ├── schema.js              # GraphQL TypeDefs (solves over-fetching)
│   │   └── resolvers.js           # GraphQL Resolvers
│   └── utils/
│       └── fieldSelector.js       # Dynamic REST field projection utility
└── test/
    └── api.test.js                # 12 comprehensive automated tests (Node test runner)
```

---

## ⚙️ Quickstart & Installation

### Prerequisites
- Node.js >= 18.x (tested on v24.19.0)
- npm >= 9.x

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
# Or for production:
npm start
```
The server will boot up at `http://localhost:3000`.

### 3. Run Automated Tests
```bash
npm test
```

---

## 📦 Module 1: RESTful Architecture & Resource Modeling

### 1. Strictly Noun-Based URIs
All resources are modeled as nouns, adhering to standard REST guidelines:
- Resource Collection: `/api/v1/products`
- Specific Resource: `/api/v1/products/:id`
- Orders Collection: `/api/v1/orders`

### 2. Proper HTTP Verbs & Status Codes
- `GET /api/v1/products`: Retrieves product collection (**200 OK**).
- `GET /api/v1/products/:id`: Retrieves single product (**200 OK**) or (**404 Not Found**).
- `POST /api/v1/products`: Creates a new product (**201 Created**) and returns `Location: /api/v1/products/:id`.
- `PUT /api/v1/products/:id`: Replaces/updates the product idempotently (**200 OK**).
- `DELETE /api/v1/products/:id`: Removes product idempotently (**200 OK**).

### 3. Catalog Filtering & Pagination via Query Parameters
To handle large enterprise catalogs without overwhelming client memory:
- **Filtering by Category**: `?category=electronics`
- **Filtering by Price Range**: `?minPrice=5000&maxPrice=150000`
- **Text Search**: `?search=samsung`
- **Pagination**: `?page=1&limit=2`

**Sample Response (`GET /api/v1/products?category=electronics&limit=1`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "sku": "DARAZ-ELEC-001",
      "title": "Samsung 55\" Crystal 4K UHD Smart TV",
      "price": 139999,
      "category": "electronics"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 1,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filtersApplied": {
    "category": "electronics",
    "minPrice": null,
    "maxPrice": null,
    "search": null,
    "fields": null
  }
}
```

---

## 🛡️ Module 2: Standardized Error Schema & Status Codes

All errors pass through a centralized error handler (`src/middlewares/errorHandler.js`) that shields against server crashes and returns a predictable schema.

### Standard Error Response Format:
```json
{
  "success": false,
  "error_code": "STRING_ERROR_CODE",
  "message": "Human-readable explanation of error",
  "timestamp": "2026-09-22T16:50:00.000Z",
  "details": null
}
```

### 1. Client Validation Failure (400 Bad Request)
Triggered when required fields are missing or invalid:
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"price": -10}'
```
**Response (400 Bad Request):**
```json
{
  "success": false,
  "error_code": "VALIDATION_FAILED",
  "message": "Client request validation failed. Please check your payload fields.",
  "timestamp": "2026-09-22T16:54:49.000Z",
  "details": [
    {
      "field": "title",
      "message": "Product title is required and must be a non-empty string."
    },
    {
      "field": "price",
      "message": "Product price is required and must be a positive number greater than 0."
    },
    {
      "field": "category",
      "message": "Product category is required and must be a non-empty string."
    }
  ]
}
```

### 2. Non-Existent Resource (404 Not Found)
Triggered when requesting a resource ID that does not exist:
```bash
curl http://localhost:3000/api/v1/products/9999
```
**Response (404 Not Found):**
```json
{
  "success": false,
  "error_code": "PRODUCT_NOT_FOUND",
  "message": "Product with ID 9999 not found",
  "timestamp": "2026-09-22T16:54:49.000Z",
  "details": null
}
```

### 3. Undefined Route (404 Not Found)
```bash
curl http://localhost:3000/api/v1/non-existent-route
```
**Response (404 Not Found):**
```json
{
  "success": false,
  "error_code": "ROUTE_NOT_FOUND",
  "message": "Cannot GET /api/v1/non-existent-route. Route does not exist on this server.",
  "timestamp": "2026-09-22T16:54:49.000Z",
  "details": null
}
```

---

## ⚡ Module 3: Over-Fetching Solution (REST Field Selection & GraphQL)

### The Problem:
A mobile home screen banner only requires **Title** and **Price**. In legacy REST, `GET /api/v1/products/1` returned 50+ attributes (specifications, warehouse locations, warranty, shipping calculations, high-res images), sending ~2.5 KB per card instead of ~150 Bytes!

We solved this via **two complementary modern techniques**:

### Solution A: REST Field Selector Query Parameter (`?fields=...`)
Clients can supply comma-separated field keys:
```bash
curl "http://localhost:3000/api/v1/products/1?fields=title,price"
```
**Optimized Response:**
```json
{
  "success": true,
  "data": {
    "title": "Samsung 55\" Crystal 4K UHD Smart TV",
    "price": 139999
  }
}
```
*Result: Payload size reduced by >90%.*

---

### Solution B: Native GraphQL Endpoint (`/graphql`)
A dedicated GraphQL Yoga endpoint is mounted at `/graphql` with an interactive browser IDE (GraphiQL).

Clients can request exactly the fields needed for their specific view:

#### Mobile Banner Query:
```graphql
query GetBannerProduct {
  product(id: "1") {
    title
    price
  }
}
```

#### Response:
```json
{
  "data": {
    "product": {
      "title": "Samsung 55\" Crystal 4K UHD Smart TV",
      "price": 139999
    }
  }
}
```

#### Complex Product Listing Query with Pagination:
```graphql
query GetCatalog {
  products(category: "electronics", limit: 2) {
    total
    page
    data {
      id
      title
      price
      rating
      vendor {
        name
        isVerified
      }
    }
  }
}
```

---

## 🔒 Bonus Enterprise Feature: Network Retry Idempotency

### The Problem:
On 3G/4G networks, client requests often succeed on the server, but the network drops before the confirmation reaches the mobile app. The app automatically retries `POST /api/v1/orders`. Without idempotency, a second order is placed and the customer's wallet/card is charged twice.

### The Solution:
Our API supports the **`Idempotency-Key`** header:
1. Client generates a unique UUID for the transaction and passes it in the `Idempotency-Key` header.
2. If network disconnects and the mobile app replays the exact same request with the same key:
   - The server detects the key in its cache.
   - It returns the original `201 Created` response instantly with an `Idempotent-Replayed: true` header.
   - **No duplicate order is inserted and inventory is NOT deducted a second time.**

```bash
# First Call (Order created, stock deducted)
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: daraz-checkout-key-9988" \
  -d '{"customerId":"CUST-1","items":[{"productId":"3","quantity":2}]}'

# Second Call (Replayed on network timeout - Returns cached response, zero duplicate deductions)
curl -i -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: daraz-checkout-key-9988" \
  -d '{"customerId":"CUST-1","items":[{"productId":"3","quantity":2}]}'
```

---

## 🧪 Automated Verification & Test Suite

The repository includes a comprehensive 12-test suite executed using Node's native test runner (`node --test`).

Run all tests:
```bash
npm test
```

### Test Suite Output:
```
▶ Module 1: RESTful Architecture & Resource Modeling
  ✔ GET /api/v1/products - Returns 200 with paginated product list
  ✔ GET /api/v1/products?category=electronics&limit=1 - Filters by category and limits page size
  ✔ POST /api/v1/products - Creates a product with 201 Created and Location header
  ✔ PUT /api/v1/products/:id - Idempotent update returns identical state on repeated calls
  ✔ DELETE /api/v1/products/:id - Deletes resource idempotently
✔ Module 1: RESTful Architecture & Resource Modeling

▶ Module 2: Standardized JSON Error Schema & Status Codes
  ✔ POST /api/v1/products - Returns 400 Bad Request with standardized error schema on validation failure
  ✔ GET /api/v1/products/9999 - Returns 404 Not Found with standardized error schema
  ✔ GET /unknown/route - Returns 404 ROUTE_NOT_FOUND with standardized schema
✔ Module 2: Standardized JSON Error Schema & Status Codes

▶ Module 1 (Bonus): Idempotent Order Creation with Idempotency-Key Header
  ✔ POST /api/v1/orders - Prevents duplicate deductions when request is replayed with same key
✔ Module 1 (Bonus): Idempotent Order Creation with Idempotency-Key Header

▶ Module 3: Over-Fetching Solutions (REST Field Selection & GraphQL)
  ✔ REST Field Selection: GET /api/v1/products/1?fields=title,price returns ONLY requested fields
  ✔ GraphQL Query: POST /graphql solves mobile banner over-fetching
  ✔ GraphQL Query: POST /graphql with pagination and filters
✔ Module 3: Over-Fetching Solutions (REST Field Selection & GraphQL)

ℹ tests 12 | pass 12 | fail 0
```

---

## 💻 cURL Testing Commands

Here is a quick reference cheat-sheet to test all endpoints:

```bash
# 1. Fetch products with filtering & pagination
curl "http://localhost:3000/api/v1/products?category=electronics&limit=2&page=1"

# 2. Solve Over-Fetching via REST Field Selector
curl "http://localhost:3000/api/v1/products/1?fields=title,price"

# 3. Create a product (201 Created)
curl -i -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Smart Watch","price":6500,"category":"electronics","stock":25}'

# 4. Trigger Validation Error (400 Bad Request)
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"price": -10}'

# 5. Idempotent PUT Update
curl -X PUT http://localhost:3000/api/v1/products/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Samsung 55 inch TV (Refreshed)","price":142000,"category":"electronics"}'

# 6. Idempotent DELETE
curl -X DELETE http://localhost:3000/api/v1/products/5

# 7. Non-existent Product (404 Not Found)
curl http://localhost:3000/api/v1/products/9999

# 8. GraphQL Query (solving mobile banner over-fetching)
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { product(id: \"1\") { title price } }"}'
```

---

## 👨‍💻 Deliverables Checklist

- [x] **1. Complete Node.js / Express Repository**: Production-structured code with separation of concerns.
- [x] **2. Endpoints for `/api/v1/products`**: Fully implemented `GET`, `POST`, `PUT`, `DELETE` with pagination & filtering.
- [x] **3. Standardized JSON Error Handling**: Unified error schema for 400, 404, 409, and 500 without server crashes.
- [x] **4. Over-Fetching Solutions**: Both REST Field Selector (`?fields=title,price`) and GraphQL endpoint (`/graphql`).
- [x] **5. Comprehensive `README.md`**: Complete architecture guide, setup steps (`npm install`, `npm start`), and test commands.
