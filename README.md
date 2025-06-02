# Goose Share

A simple session sharing service for Goose, implemented with Node.js, Express, and SQLite.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
```
GET /_status
```
Returns service health status.

### Ping
```
GET /api/ping
```
Simple test endpoint.

### Share Session
```
POST /api/sessions/share
```
Create a new shared session.

Request body:
```json
{
  "messages": [
    {
      "created": 1234567890,
      "role": "user",
      "content": []
    }
  ],
  "working_dir": "/path/to/dir",
  "description": "Session description",
  "base_url": "http://localhost:3000",
  "total_tokens": 123
}
```

### Get Shared Session
```
GET /api/sessions/share/:share_token
```
Retrieve a shared session by token.

### List Sessions
```
GET /api/sessions
```
List all shared sessions.

## Database

The service uses SQLite with two tables:
- `sessions`: Stores session metadata
- `messages`: Stores session messages

The database file is created at `data/sessions.db`.

## Configuration

The server runs on port 3000 by default. Set the `PORT` environment variable to change this:

```bash
PORT=8080 npm start
```