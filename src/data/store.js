import { initialProducts } from './initialProducts.js';

class DataStore {
  constructor() {
    this.reset();
  }

  reset() {
    // Deep clone initial products
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.orders = [];
    this.idempotencyCache = new Map(); // key -> { status: 'COMPLETED'|'PENDING', statusCode, body, createdAt }
    this.nextProductId = 6;
    this.nextOrderId = 1001;
  }

  // --- Product Methods ---

  findAllProducts({ category, minPrice, maxPrice, search, page = 1, limit = 10 } = {}) {
    let filtered = [...this.products];

    // Filter by category
    if (category) {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by min price
    if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
      filtered = filtered.filter((p) => p.price >= Number(minPrice));
    }

    // Filter by max price
    if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
      filtered = filtered.filter((p) => p.price <= Number(maxPrice));
    }

    // Text search on title and description
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const paginated = filtered.slice(startIndex, startIndex + safeLimit);

    return {
      data: paginated,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  findProductById(id) {
    return this.products.find((p) => String(p.id) === String(id)) || null;
  }

  createProduct(data) {
    const newId = String(this.nextProductId++);
    const now = new Date().toISOString();

    const newProduct = {
      id: newId,
      sku: data.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      title: data.title,
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      brand: data.brand || 'Generic',
      category: data.category.toLowerCase(),
      subCategory: data.subCategory || 'general',
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : Number(data.price),
      currency: data.currency || 'PKR',
      discountPercentage: data.discountPercentage || 0,
      inStock: data.stock !== undefined ? Number(data.stock) > 0 : true,
      stock: data.stock !== undefined ? Number(data.stock) : 10,
      lowStockThreshold: data.lowStockThreshold || 5,
      rating: data.rating !== undefined ? Number(data.rating) : 5.0,
      reviewCount: data.reviewCount || 0,
      shortDescription: data.shortDescription || data.description?.slice(0, 100) || '',
      description: data.description || '',
      specifications: data.specifications || {},
      dimensions: data.dimensions || { widthCm: 10, heightCm: 10, depthCm: 10, weightKg: 1 },
      vendor: data.vendor || {
        id: 'VEND-DEFAULT',
        name: 'Daraz Verified Merchant',
        rating: 4.5,
        isVerified: true,
        warehouseLocation: 'Karachi Central Hub',
      },
      shipping: data.shipping || {
        method: 'Standard Delivery',
        estimatedDays: 3,
        isFreeShipping: false,
        shippingCost: 150,
      },
      warranty: data.warranty || { durationMonths: 12, type: 'Seller Warranty' },
      returnPolicy: data.returnPolicy || { returnable: true, returnWindowDays: 7 },
      tags: data.tags || [data.category],
      images: data.images || ['https://cdn.daraz.pk/placeholder.jpg'],
      createdAt: now,
      updatedAt: now,
    };

    this.products.push(newProduct);
    return newProduct;
  }

  /**
   * Idempotent PUT operation:
   * Replaces or updates the resource completely with deterministic result.
   */
  replaceProduct(id, data) {
    const index = this.products.findIndex((p) => String(p.id) === String(id));
    if (index === -1) {
      return null;
    }

    const existing = this.products[index];
    const now = new Date().toISOString();

    const updated = {
      ...existing,
      ...data,
      id: String(id), // ID is immutable
      price: data.price !== undefined ? Number(data.price) : existing.price,
      stock: data.stock !== undefined ? Number(data.stock) : existing.stock,
      inStock: data.stock !== undefined ? Number(data.stock) > 0 : existing.inStock,
      category: data.category ? data.category.toLowerCase() : existing.category,
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    this.products[index] = updated;
    return updated;
  }

  deleteProduct(id) {
    const index = this.products.findIndex((p) => String(p.id) === String(id));
    if (index === -1) {
      return false;
    }
    this.products.splice(index, 1);
    return true;
  }

  // --- Order Methods (with Idempotency) ---

  createOrder(orderData) {
    const orderId = `ORD-${this.nextOrderId++}`;
    const now = new Date().toISOString();

    const order = {
      id: orderId,
      customerId: orderData.customerId || 'CUST-001',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      currency: orderData.currency || 'PKR',
      status: 'CONFIRMED',
      paymentMethod: orderData.paymentMethod || 'COD',
      deliveryAddress: orderData.deliveryAddress || 'Gulberg III, Lahore, Pakistan',
      createdAt: now,
    };

    this.orders.push(order);
    return order;
  }

  findOrderById(id) {
    return this.orders.find((o) => String(o.id) === String(id)) || null;
  }

  // --- Idempotency Cache ---

  getIdempotencyRecord(key) {
    return this.idempotencyCache.get(key) || null;
  }

  setIdempotencyRecord(key, record) {
    this.idempotencyCache.set(key, {
      ...record,
      timestamp: Date.now(),
    });
  }
}

export const store = new DataStore();
