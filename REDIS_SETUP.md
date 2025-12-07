# Redis Setup Guide

## Option 1: Homebrew (macOS - Recommended)

```bash
# Install Redis
brew install redis

# Start Redis (runs in background)
brew services start redis

# Or run Redis manually (foreground)
redis-server
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

## Option 2: Docker (if Docker Desktop is running)

```bash
# Start Docker Desktop first, then:
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify
docker ps | grep redis
```

## Option 3: Run Without Redis (Development Only)

The server will start without Redis, but:
- ✅ Search will work
- ❌ Batch downloads will return 503 error

**Just start the server:**
```bash
cd backend
npm run dev
```

You'll see warnings but the server will work for search functionality.

## Verify Redis Connection

```bash
# Test connection
redis-cli ping

# Check if Redis is listening
lsof -i :6379
```

## Stop Redis

**Homebrew:**
```bash
brew services stop redis
```

**Docker:**
```bash
docker stop redis
docker rm redis
```

