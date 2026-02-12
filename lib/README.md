# WinScan Refactored Library

This directory contains the refactored, organized codebase for WinScan blockchain explorer.

## Directory Structure

```
lib/
├── api/                    # Unified API client
│   ├── client.ts          # Main API client with retry & load balancing
│   ├── config.ts          # API configuration
│   ├── types.ts           # API type definitions
│   └── index.ts           # Barrel export
│
├── routes/                 # Route handler utilities
│   ├── factory.ts         # Route handler factory
│   ├── middleware.ts      # Common middleware
│   ├── validators.ts      # Parameter validation
│   ├── types.ts           # Route types
│   └── index.ts           # Barrel export
│
├── blockchain/             # Blockchain-specific utilities
│   ├── cosmos/            # Cosmos SDK utilities
│   │   ├── address.ts     # Address conversion & validation
│   │   ├── denom.ts       # Denomination formatting
│   │   └── index.ts       # Barrel export
│   ├── evm/               # EVM utilities
│   │   ├── address.ts     # EVM address utilities
│   │   └── index.ts       # Barrel export
│   ├── ibc/               # IBC utilities
│   │   ├── channels.ts    # IBC channel utilities
│   │   ├── transfer.ts    # IBC transfer utilities
│   │   └── index.ts       # Barrel export
│   └── index.ts           # Barrel export
│
├── cache/                  # Caching layer
│   ├── manager.ts         # Cache manager
│   ├── strategies.ts      # Cache strategies
│   ├── types.ts           # Cache types
│   └── index.ts           # Barrel export
│
├── errors/                 # Error handling
│   ├── handler.ts         # Error handler
│   ├── types.ts           # Error types
│   └── index.ts           # Barrel export
│
├── utils/                  # General utilities
│   ├── formatters/        # Data formatting
│   │   ├── number.ts      # Number formatters
│   │   ├── date.ts        # Date formatters
│   │   ├── token.ts       # Token formatters
│   │   └── index.ts       # Barrel export
│   ├── validators/        # Input validation
│   │   ├── input.ts       # Input validators
│   │   ├── params.ts      # Parameter validators
│   │   └── index.ts       # Barrel export
│   └── transformers/      # Data transformation
│       ├── blockchain.ts  # Blockchain data transformers
│       ├── response.ts    # Response transformers
│       └── index.ts       # Barrel export
│
├── types/                  # Shared type definitions
│   ├── api.ts             # API types
│   ├── blockchain.ts      # Blockchain types
│   ├── validator.ts       # Validator types
│   ├── cache.ts           # Cache types
│   ├── error.ts           # Error types
│   └── index.ts           # Barrel export
│
└── i18n/                   # Internationalization
    ├── loader.ts          # Translation loader
    ├── types.ts           # i18n types
    └── index.ts           # Barrel export
```

## Usage

### API Client

```typescript
import { apiClient } from '@/lib/api';

// Simple GET request
const data = await apiClient.get('/validators', {
  params: { chain: 'cosmoshub' }
});

// GET request with caching
const cachedData = await apiClient.withCache(
  'validators-cosmoshub',
  () => apiClient.get('/validators', { params: { chain: 'cosmoshub' } }),
  60000 // 1 minute TTL
);
```

### Route Handler Factory

```typescript
import { createRoute } from '@/lib/routes';

export const GET = createRoute({
  requiredParams: ['chain'],
  optionalParams: ['limit'],
  cacheConfig: {
    ttl: 60000,
    staleWhileRevalidate: 120000
  },
  handler: async ({ chain, limit }) => {
    // Your handler logic
    return data;
  }
});
```

### Error Handling

```typescript
import { errorHandler } from '@/lib/errors';

try {
  // Your code
} catch (error) {
  const apiError = errorHandler.handle(error, {
    endpoint: '/api/validators',
    chain: 'cosmoshub'
  });
  
  errorHandler.log(apiError);
  return errorHandler.toResponse(apiError);
}
```

### Cache Manager

```typescript
import { cacheManager } from '@/lib/cache';

// Wrap a function with caching
const data = await cacheManager.wrap(
  'my-cache-key',
  async () => {
    // Fetch data
    return data;
  },
  60000 // TTL in ms
);

// Invalidate cache by pattern
await cacheManager.invalidate('validators-.*');
```

### Blockchain Utilities

```typescript
import { cosmos, evm, ibc } from '@/lib/blockchain';

// Convert Cosmos address
const newAddress = cosmos.convertAddress(
  'cosmos1abc...',
  'osmo'
);

// Validate EVM address
const isValid = evm.isValidEvmAddress('0x123...');

// Format IBC channel
const channelId = ibc.formatChannelId(0); // 'channel-0'
```

### Formatters

```typescript
import { formatters } from '@/lib/utils';

// Format number
const formatted = formatters.formatNumber(1234567.89, 2); // "1,234,567.89"

// Format token amount
const amount = formatters.formatTokenAmount('1000000', 6); // "1.0"

// Format date
const date = formatters.formatDate(new Date()); // "Jan 17, 2026, 10:30 AM"
```

## Path Aliases

The following path aliases are configured in `tsconfig.json`:

- `@/lib/api` - API client
- `@/lib/routes` - Route handlers
- `@/lib/blockchain` - Blockchain utilities
- `@/lib/cache` - Cache manager
- `@/lib/errors` - Error handling
- `@/lib/utils` - General utilities
- `@/lib/i18n` - Internationalization
- `@/lib/types` - Type definitions

## Features

### API Client
- ✅ Automatic retry with exponential backoff
- ✅ Load balancing across multiple URLs
- ✅ Configurable timeouts
- ✅ Built-in caching support
- ✅ Consistent error handling

### Route Handler Factory
- ✅ Automatic parameter validation
- ✅ Consistent error responses
- ✅ Automatic cache header application
- ✅ Request logging
- ✅ Error logging with context

### Cache Manager
- ✅ In-memory caching
- ✅ TTL support
- ✅ Stale-while-revalidate
- ✅ Pattern-based invalidation
- ✅ Tag-based invalidation

### Error Handler
- ✅ Error categorization
- ✅ Error sanitization
- ✅ Consistent error formatting
- ✅ Structured logging

## Migration Guide

### From Legacy API Client

**Before:**
```typescript
import { fetchApi } from '@/lib/api';

const response = await fetchApi('/validators?chain=cosmoshub');
```

**After:**
```typescript
import { apiClient } from '@/lib/api';

const response = await apiClient.get('/validators', {
  params: { chain: 'cosmoshub' }
});
```

### From Legacy Route Handlers

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const chain = request.nextUrl.searchParams.get('chain');
  
  if (!chain) {
    return NextResponse.json({ error: 'Missing chain' }, { status: 400 });
  }
  
  try {
    const data = await fetchData(chain);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**After:**
```typescript
import { createRoute } from '@/lib/routes';

export const GET = createRoute({
  requiredParams: ['chain'],
  handler: async ({ chain }) => {
    return await fetchData(chain);
  }
});
```

## Testing

All modules include comprehensive tests:

- Unit tests for individual functions
- Property-based tests for universal behaviors
- Integration tests for module interactions

Run tests with:
```bash
npm test
```

## Contributing

When adding new utilities:

1. Place them in the appropriate domain directory
2. Add JSDoc comments
3. Export from the directory's `index.ts`
4. Update this README
5. Add tests

## License

MIT License - See LICENSE file for details
