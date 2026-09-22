import { ProductService } from './product.service.js';
import { HTTP_STATUS } from '../../config/constants.js';

export class ProductController {
  static getProducts(req, res, next) {
    try {
      const { category, minPrice, maxPrice, search, page, limit, fields } = req.query;
      const result = ProductService.getProducts({
        category,
        minPrice,
        maxPrice,
        search,
        page,
        limit,
        fields,
      });
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  static getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const { fields } = req.query;
      const result = ProductService.getProductById(id, fields);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  static createProduct(req, res, next) {
    try {
      const result = ProductService.createProduct(req.body);
      // Enterprise REST best practice: Set Location header to the newly created resource URI
      res.setHeader('Location', `/api/v1/products/${result.data.id}`);
      return res.status(HTTP_STATUS.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  static updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = ProductService.updateProduct(id, req.body);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  static deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = ProductService.deleteProduct(id);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}
