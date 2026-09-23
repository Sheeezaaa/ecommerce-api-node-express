
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



<img width="1339" height="882" alt="FILE1" src="https://github.com/user-attachments/assets/e99bbaca-0513-4cab-8f68-afbcfa55ba24" />
<img width="991" height="560" alt="FILE 2" src="https://github.com/user-attachments/assets/438e0efc-fd98-4716-b3cf-79bfb63a3c51" />
<img width="1115" height="967" alt="FILE3" src="https://github.com/user-attachments/assets/01a6cd44-8370-4b38-950d-5c331abba794" />






