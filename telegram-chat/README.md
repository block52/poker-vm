# Telegram Chat Server

A Go server that bridges Telegram channel/group messages to the Block52 Poker UI via WebSocket.

## Features

- Receives Telegram messages via webhook
- Broadcasts messages to connected WebSocket clients in real-time
- Stores recent message history (configurable limit)
- Supports photos, videos, documents, and stickers
- Secure webhook validation with secret token

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the prompts
3. Copy the bot token provided

### 2. Add Bot to Channel/Group

1. Add your bot to the channel/group as an administrator
2. For channels: The bot needs "Post Messages" permission
3. For groups: The bot will receive all messages automatically

### 3. Get Chat ID

For channels:
- Forward a message from the channel to [@userinfobot](https://t.me/userinfobot)
- The chat ID will be shown (usually starts with -100)

For groups:
- Add [@RawDataBot](https://t.me/RawDataBot) to the group temporarily
- It will show the chat ID

### 4. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
TELEGRAM_SECRET_TOKEN=random_secure_string
```

### 5. Set Up Webhook

The webhook URL must be HTTPS. For local development, use a tunneling service like ngrok:

```bash
ngrok http 8080
```

Then set the webhook:
```bash
curl -X POST "http://localhost:8080/api/admin/webhook/setup"
```

## Running

### Development

```bash
# Install dependencies
make deps

# Run the server
make run
```

### Docker

```bash
# Build and run
make docker-build
make docker-run
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ws` | WebSocket connection |
| POST | `/api/telegram/webhook` | Telegram webhook receiver |
| GET | `/api/chat/history` | Get message history |
| POST | `/api/admin/webhook/setup` | Configure Telegram webhook |
| GET | `/api/admin/webhook/info` | Get webhook status |
| GET | `/api/admin/bot/info` | Get bot information |

## WebSocket Messages

### Incoming (Server → Client)

```typescript
// Connection confirmed
{ "type": "chat:connected", "payload": { "clientId": "..." } }

// Message history on connect
{ "type": "chat:history", "payload": [...messages] }

// New message
{ "type": "chat:message", "payload": { ...message } }
```

### Message Format

```typescript
interface ChatMessage {
  id: string;
  text: string;
  sender: {
    id: number;
    username?: string;
    firstName: string;
    lastName?: string;
  };
  timestamp: number;
  replyTo?: string;
  mediaType?: "photo" | "video" | "document" | "sticker";
  mediaUrl?: string;
  createdAt: string;
}
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram Bot   │────▶│  This Server     │────▶│    React UI     │
│  (Webhook)      │     │  (WebSocket Hub) │◀────│  (Chat Page)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```
