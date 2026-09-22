export const typeDefs = /* GraphQL */ `
  type Vendor {
    id: ID!
    name: String!
    rating: Float
    isVerified: Boolean
    warehouseLocation: String
    contactEmail: String
  }

  type Shipping {
    method: String!
    estimatedDays: Int
    isFreeShipping: Boolean
    shippingCost: Float
  }

  type Product {
    id: ID!
    sku: String
    title: String!
    slug: String
    brand: String
    category: String!
    subCategory: String
    price: Float!
    originalPrice: Float
    currency: String
    discountPercentage: Float
    inStock: Boolean
    stock: Int
    rating: Float
    reviewCount: Int
    shortDescription: String
    description: String
    vendor: Vendor
    shipping: Shipping
    tags: [String!]
    images: [String!]
    createdAt: String
    updatedAt: String
  }

  type ProductPagination {
    data: [Product!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  input CreateProductInput {
    title: String!
    price: Float!
    category: String!
    brand: String
    stock: Int
    description: String
  }

  input UpdateProductInput {
    title: String!
    price: Float!
    category: String!
    brand: String
    stock: Int
    description: String
  }

  type Query {
    """
    Fetch paginated list of products with optional filters.
    Clients can select ONLY required fields (e.g. title, price) to eliminate over-fetching.
    """
    products(
      category: String
      minPrice: Float
      maxPrice: Float
      search: String
      page: Int
      limit: Int
    ): ProductPagination!

    """
    Fetch single product by ID. Solves mobile banner over-fetching problem.
    """
    product(id: ID!): Product
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product
    deleteProduct(id: ID!): DeleteResponse!
  }
`;
