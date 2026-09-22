import { store } from '../../data/store.js';
import { NotFoundError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';
import { selectFields } from '../../utils/fieldSelector.js';

export class ProductService {
  static getProducts({ category, minPrice, maxPrice, search, page, limit, fields }) {
    const result = store.findAllProducts({ category, minPrice, maxPrice, search, page, limit });

    // Handle REST field filtering to solve over-fetching
    const projectedData = fields ? selectFields(result.data, fields) : result.data;

    return {
      success: true,
      data: projectedData,
      pagination: result.pagination,
      filtersApplied: {
        category: category || null,
        minPrice: minPrice !== undefined ? Number(minPrice) : null,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : null,
        search: search || null,
        fields: fields || null,
      },
    };
  }

  static getProductById(id, fields) {
    const product = store.findProductById(id);
    if (!product) {
      throw new NotFoundError(
        `Product with ID ${id} not found`,
        ERROR_CODES.PRODUCT_NOT_FOUND
      );
    }

    // Handle REST field filtering to solve over-fetching
    const data = fields ? selectFields(product, fields) : product;

    return {
      success: true,
      data,
    };
  }

  static createProduct(payload) {
    const newProduct = store.createProduct(payload);
    return {
      success: true,
      message: 'Product created successfully',
      data: newProduct,
    };
  }

  static updateProduct(id, payload) {
    const updatedProduct = store.replaceProduct(id, payload);
    if (!updatedProduct) {
      throw new NotFoundError(
        `Product with ID ${id} not found`,
        ERROR_CODES.PRODUCT_NOT_FOUND
      );
    }
    return {
      success: true,
      message: 'Product updated successfully (Idempotent PUT)',
      data: updatedProduct,
    };
  }

  static deleteProduct(id) {
    const deleted = store.deleteProduct(id);
    if (!deleted) {
      throw new NotFoundError(
        `Product with ID ${id} not found`,
        ERROR_CODES.PRODUCT_NOT_FOUND
      );
    }
    return {
      success: true,
      message: `Product with ID ${id} was deleted successfully`,
    };
  }
}
