import { store } from '../data/store.js';

export const resolvers = {
  Query: {
    products: (_parent, args) => {
      const result = store.findAllProducts({
        category: args.category,
        minPrice: args.minPrice,
        maxPrice: args.maxPrice,
        search: args.search,
        page: args.page,
        limit: args.limit,
      });

      return {
        data: result.data,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      };
    },

    product: (_parent, { id }) => {
      return store.findProductById(id);
    },
  },

  Mutation: {
    createProduct: (_parent, { input }) => {
      return store.createProduct(input);
    },

    updateProduct: (_parent, { id, input }) => {
      const updated = store.replaceProduct(id, input);
      if (!updated) {
        throw new Error(`Product with ID ${id} not found`);
      }
      return updated;
    },

    deleteProduct: (_parent, { id }) => {
      const deleted = store.deleteProduct(id);
      return {
        success: deleted,
        message: deleted
          ? `Product ${id} was deleted successfully.`
          : `Product ${id} not found.`,
      };
    },
  },
};
