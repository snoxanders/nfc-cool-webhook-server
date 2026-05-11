# NFC.cool Webhook Server

A simple webhook server for testing [NFC.cool](https://nfc.cool) webhook integration.

## Quick Start

```bash
git clone https://github.com/NickAtGit/nfc-cool-webhook-server.git
cd nfc-cool-webhook-server
npm install
npm start
```

The server starts on port 3000 with HTTP Basic Authentication enabled by default.

## Configuration

Set environment variables to customize:

| Variable | Default | Description |
|---|---|---|
| `WEBHOOK_USERNAME` | `admin` | HTTP Basic Auth username |
| `WEBHOOK_PASSWORD` | `secret` | HTTP Basic Auth password |
| `PORT` | `3000` | Server port |
| `AUTH_ENABLED` | `true` | Set to `false` to disable authentication |

### Run without authentication

```bash
AUTH_ENABLED=false npm start
```

## NFC.cool App Setup

1. Open NFC.cool → More → Webhook
2. Set URL to `http://YOUR_IP:3000/webhook`
3. Enable the webhook
4. (Optional) Enable HTTP Authentication with username `admin` and password `secret`
5. Tap "Test Webhook" to verify the connection

## Payload Format

### Standard NFC Tag

```json
{
  "identifier": "04:EC:FC:A2:94:10:90",
  "date": "2026-05-11T15:00:00Z",
  "content": "https://nfc.cool"
}
```

### OpenPrintTag (structured)

```json
{
  "identifier": "04:EC:FC:A2:94:10:90",
  "date": "2026-05-11T15:00:00Z",
  "content": "PLA Matte Black",
  "tagType": "openPrintTag",
  "structured": {
    "materialClass": "filament",
    "materialName": "PLA Matte Black",
    "materialType": { "abbreviation": "PLA" },
    "minPrintTemperature": 200
  }
}
```

| Field | Description |
|---|---|
| `identifier` | NFC tag UID |
| `date` | ISO 8601 timestamp of the scan |
| `content` | Tag content (text, URL, or material name for OpenPrintTag) |
| `tagType` | Present only for specialized tags (e.g. `openPrintTag`) |
| `structured` | Full decoded tag model (present only when `tagType` is set) |

## Testing with cURL

### With authentication

```bash
curl -X POST http://localhost:3000/webhook \
  -u admin:secret \
  -H "Content-Type: application/json" \
  -d '{"identifier":"04:EC:FC:A2:94:10:90","date":"2026-05-11T15:00:00Z","content":"https://nfc.cool"}'
```

### Without authentication

```bash
AUTH_ENABLED=false npm start
# In another terminal:
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"identifier":"04:EC:FC:A2:94:10:90","date":"2026-05-11T15:00:00Z","content":"https://nfc.cool"}'
```

## License

MIT
