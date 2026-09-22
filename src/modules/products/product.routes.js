import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { validate } from '../../middlewares/validate.js';
import { validateCreateProduct, validateUpdateProduct } from './product.validation.js';

const router = Router();

// Strictly Noun-Based URI: /api/v1/products
router
  .route('/')
  .get(ProductController.getProducts)
  .post(validate(validateCreateProduct), ProductController.createProduct);

router
  .route('/:id')
  .get(ProductController.getProductById)
  .put(validate(validateUpdateProduct), ProductController.updateProduct)
  .delete(ProductController.deleteProduct);

export default router;
