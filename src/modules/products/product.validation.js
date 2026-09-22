export function validateCreateProduct(req) {
  const { title, price, category, stock } = req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Product title is required and must be a non-empty string.',
    });
  }

  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
    errors.push({
      field: 'price',
      message: 'Product price is required and must be a positive number greater than 0.',
    });
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push({
      field: 'category',
      message: 'Product category is required and must be a non-empty string.',
    });
  }

  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
    errors.push({
      field: 'stock',
      message: 'Product stock must be a non-negative integer (>= 0).',
    });
  }

  return errors;
}

export function validateUpdateProduct(req) {
  const { title, price, category, stock } = req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Product title is required and must be a non-empty string.',
    });
  }

  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
    errors.push({
      field: 'price',
      message: 'Product price is required and must be a positive number greater than 0.',
    });
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push({
      field: 'category',
      message: 'Product category is required and must be a non-empty string.',
    });
  }

  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
    errors.push({
      field: 'stock',
      message: 'Product stock must be a non-negative integer (>= 0).',
    });
  }

  return errors;
}
