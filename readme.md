# TenantForge

A multi-tenant architecture demonstration in Node.js that implements the concepts discussed in the article [Building the Future: Understanding Multi-Tenant Systems in Software Development](https://medium.com/@shinup/building-the-future-understanding-multi-tenant-systems-in-software-development-5a532ee99f18).

## Key Multi-Tenant Concepts Implemented

### 1. Tenant Identification and Isolation

- **Header-Based Identification**: Each request requires a `x-tenant-id` header to identify the tenant.
- **Data Isolation**: MongoDB collections are partitioned with a `tenantId` field on each document.
- **Security Boundaries**: JWT tokens include the tenant ID, and all data access is filtered by the tenant.

### 2. Tenant Configuration Management

- **Tenant-Specific Configuration**: Each tenant has its own configuration stored in the database.
- **Feature Flags**: Tenants can have different features enabled or disabled.
- **Customization Options**: UI themes, limits, and other settings can be configured per tenant.

### 3. Authentication and Authorization

- **Tenant-Specific User Base**: Users belong to a specific tenant and can only access data within their tenant.
- **Role-Based Access**: Admin and user roles with different permission levels.
- **Tenant-Aware Authentication**: JWT tokens are scoped to a specific tenant ID.

### 4. Data Partitioning Strategy

This demonstration uses the "Shared Database, Shared Schema" approach with tenant discrimination:

- Single MongoDB database
- All tenants share the same collections (users, products)
- Each document contains a `tenantId` field for filtering
- MongoDB indexes on `tenantId` for performance

### 5. Resource Limits and Throttling

- **Tenant-Specific Limits**: Each tenant has configurable limits for users, products, and storage.
- **Limit Enforcement**: Utility functions to check against tenant limits before creating resources.

## Getting Started

### Prerequisites

- Node.js 14+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables in `.env` file
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Tenant Management

- `GET /api/tenants` - Get all tenants (admin)
- `GET /api/tenants/:id` - Get tenant by ID (admin)
- `POST /api/tenants` - Create new tenant (admin)
- `PUT /api/tenants/:id` - Update tenant (admin)
- `GET /api/tenants/config/current` - Get current tenant configuration

### User Management

- `POST /api/users/login` - User login
- `POST /api/users/register` - Register new user
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - Get all users for tenant (admin)

### Product Management

- `GET /api/products` - Get all products for tenant
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

## Multi-Tenant Architecture Implementation Details

### Tenant Identification Flow

1. Client includes the tenant ID in the `x-tenant-id` header
2. Express middleware extracts and validates the tenant ID
3. All database queries filter by the tenant ID
4. JWT tokens contain the tenant ID to prevent cross-tenant access

### Data Isolation Implementation

The MongoDB models include a `tenantId` field and compound indexes to ensure:

- Data can only be accessed by the correct tenant
- Queries automatically filter by tenant ID
- Unique constraints work within tenant boundaries

### Scalability Considerations

- Indexes on `tenantId` field for efficient queries
- Connection pooling to optimize database access
- Potential for future sharding based on tenant ID

## Security Measures

- JWT tokens are tenant-specific
- Middleware validates tenant access on every request
- Cross-tenant data access is prevented at multiple levels
- Role-based permissions within each tenant

## Future Enhancements

- Support for multiple tenant isolation strategies (separate databases, schemas)
- Tenant provisioning and onboarding workflow
- Monitoring and analytics for tenant resource usage
- Caching layer with tenant-specific cache segmentation
