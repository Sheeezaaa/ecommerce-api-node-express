
# 🛒 Enterprise E-Commerce API Modernization (Daraz / Bazaar Analogy)
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





<img width="1339" height="882" alt="FILE1" src="https://github.com/user-attachments/assets/e99bbaca-0513-4cab-8f68-afbcfa55ba24" />
<img width="991" height="560" alt="FILE 2" src="https://github.com/user-attachments/assets/438e0efc-fd98-4716-b3cf-79bfb63a3c51" />
<img width="1115" height="967" alt="FILE3" src="https://github.com/user-attachments/assets/01a6cd44-8370-4b38-950d-5c331abba794" />






