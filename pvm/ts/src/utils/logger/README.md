# PVM Logger System

A flexible logging system for the Poker VM with multiple storage backends.

## Interface

All loggers implement the `ILogger` interface with two methods:

```typescript
interface ILogger {
  log(message: string, level?: 'info' | 'warn' | 'error' | 'debug'): Promise<void> | void;
  purge(): Promise<void> | void;
}
```

## Logger Implementations

### 1. ConsoleLogger

A simple wrapper around console methods with formatted output.

```typescript
import { ConsoleLogger } from './utils/logger';

const logger = new ConsoleLogger();
logger.log('Application started');
logger.log('Warning: Low memory', 'warn');
logger.log('Error occurred', 'error');
logger.purge(); // Clears console
```

**Features:**
- Timestamps all messages
- Color-coded output by level
- Synchronous operation

### 2. DiskLogger

Writes logs to disk with automatic file rotation when logs exceed 50MB.

```typescript
import { DiskLogger } from './utils/logger';

// Default: uses OS logs directory
const logger = new DiskLogger();

// Custom path
const customLogger = new DiskLogger('/var/log/myapp');

await logger.log('Server started');
await logger.log('Database connection failed', 'error');
await logger.purge(); // Deletes all log files
```

**Features:**
- Automatic file rotation at 50MB
- Default paths:
  - macOS: `~/Library/Logs/pvm`
  - Windows: `%APPDATA%/logs/pvm`
  - Linux: `~/logs/pvm`
- Archives old logs with timestamps
- Asynchronous file operations

### 3. RedisLogger

Stores logs in Redis as a list.

```typescript
import { RedisLogger } from './utils/logger';

const logger = new RedisLogger('redis://localhost:6379', 'pvm:logs');

await logger.log('Cache cleared');
await logger.log('Session expired', 'warn');
await logger.purge(); // Clears all logs from Redis

// Don't forget to disconnect
await logger.disconnect();
```

**Features:**
- Stores logs as JSON in Redis lists
- Auto-reconnection on connection loss
- Configurable Redis URL and key
- Fast write performance

### 4. MongoDBLogger

Stores logs in MongoDB with full document structure.

```typescript
import { MongoDBLogger } from './utils/logger';

const logger = new MongoDBLogger(
  'mongodb://localhost:27017',
  'pvm',
  'logs'
);

await logger.log('User authenticated');
await logger.log('Payment failed', 'error');
await logger.purge(); // Deletes all log documents

// Don't forget to disconnect
await logger.disconnect();
```

**Features:**
- Structured document storage
- Queryable by timestamp, level, or message
- Configurable database and collection names
- Supports MongoDB's full query capabilities

## Installation

After creating these files, install the required dependencies:

```bash
cd pvm/ts
yarn install
```

This will install:
- `redis` (^4.7.0) - For RedisLogger
- `mongodb` (^6.0.0) - For MongoDBLogger

## Usage Patterns

### Single Logger

```typescript
import { ConsoleLogger } from './utils/logger';

const logger = new ConsoleLogger();
logger.log('Simple logging');
```

### Multiple Loggers

```typescript
import { ConsoleLogger, DiskLogger } from './utils/logger';
import { ILogger } from './utils/logger';

class MultiLogger implements ILogger {
  private loggers: ILogger[];

  constructor(...loggers: ILogger[]) {
    this.loggers = loggers;
  }

  async log(message: string, level?: 'info' | 'warn' | 'error' | 'debug') {
    await Promise.all(
      this.loggers.map(logger => logger.log(message, level))
    );
  }

  async purge() {
    await Promise.all(
      this.loggers.map(logger => logger.purge())
    );
  }
}

const multiLogger = new MultiLogger(
  new ConsoleLogger(),
  new DiskLogger()
);

await multiLogger.log('This goes to both console and disk');
```

## Best Practices

1. **Remember to disconnect** - For Redis and MongoDB loggers, call `disconnect()` when your application shuts down
2. **Error handling** - All loggers handle errors internally and log to console as fallback
3. **Performance** - For high-volume logging, consider Redis or MongoDB over DiskLogger
4. **Purge carefully** - The purge method permanently deletes logs
5. **File rotation** - DiskLogger automatically rotates at 50MB, old files are preserved with timestamps
