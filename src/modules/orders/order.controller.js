import { store } from '../../data/store.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { BadRequestError, NotFoundError } from '../../errors/AppError.js';

export class OrderController {
  static createOrder(req, res, next) {
    try {
      const { items, customerId, paymentMethod, deliveryAddress } = req.body || {};

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestError(
          'Order must contain at least one item.',
          [{ field: 'items', message: 'items array is required and must not be empty' }],
          ERROR_CODES.VALIDATION_FAILED
        );
      }

      // Calculate total and verify inventory
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
          throw new BadRequestError(
            'Each order item must specify a valid productId and positive quantity.',
            [{ field: 'items', message: 'Invalid productId or quantity' }]
          );
        }

        const product = store.findProductById(item.productId);
        if (!product) {
          throw new NotFoundError(
            `Cannot place order. Product with ID ${item.productId} does not exist.`,
            ERROR_CODES.PRODUCT_NOT_FOUND
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for product "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}`,
            [{ field: 'stock', message: 'Insufficient inventory' }]
          );
        }

        // Deduct inventory (demonstrating state mutation)
        product.stock -= Number(item.quantity);
        product.inStock = product.stock > 0;

        const itemSubtotal = product.price * Number(item.quantity);
        totalAmount += itemSubtotal;

        orderItems.push({
          productId: product.id,
          title: product.title,
          unitPrice: product.price,
          quantity: Number(item.quantity),
          subtotal: itemSubtotal,
        });
      }

      const newOrder = store.createOrder({
        customerId,
        items: orderItems,
        totalAmount,
        currency: 'PKR',
        paymentMethod,
        deliveryAddress,
      });

      res.setHeader('Location', `/api/v1/orders/${newOrder.id}`);
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Order created and payment authorized successfully',
        data: newOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  static getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = store.findOrderById(id);
      if (!order) {
        throw new NotFoundError(`Order with ID ${id} not found`, ERROR_CODES.ORDER_NOT_FOUND);
      }
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
