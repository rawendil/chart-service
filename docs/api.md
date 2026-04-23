# API Reference

An interactive OpenAPI/Swagger explorer is available at <http://localhost:3000/api/docs> when the service is running. This file summarizes the same surface for quick reference.

## Authentication

Protected endpoints require an API key passed via the `x-api-key` header:

```
x-api-key: <your-api-key>
```

Set the key in `.env` as `API_KEY`. Minimum 16 characters recommended.

## Endpoints

### Charts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/charts/generate` | `x-api-key` | Generate and store a new chart |
| `GET` | `/api/charts/:hash` | none / `?token=` | Chart metadata — token required if chart has shareToken |
| `GET` | `/api/charts/:hash/png` | none / `?token=` | Chart as PNG image |
| `GET` | `/api/charts/:hash/embed` | none / `?token=` | Embeddable HTML snippet |
| `GET` | `/api/charts/:hash/json` | none / `?token=` | Full chart data as JSON |
| `PUT` | `/api/charts/:hash` | `x-api-key` | Update chart |
| `DELETE` | `/api/charts/:hash` | `x-api-key` | Delete chart |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Basic liveness check |
| `GET` | `/api/health/detailed` | Detailed status including DB/Redis |

## Examples

### Generate a chart

```bash
# Public chart (no token required to access)
curl -X POST http://localhost:3000/api/charts/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "title": "Sales Report",
    "chartType": "bar",
    "data": {
      "labels": ["Jan", "Feb", "Mar"],
      "datasets": [{ "label": "Sales", "data": [100, 200, 150] }]
    },
    "width": 800,
    "height": 600,
    "theme": "light"
  }'

# Private chart (shareToken required to access)
curl -X POST http://localhost:3000/api/charts/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "title": "Sales Report",
    "chartType": "bar",
    "shareToken": "my-service-token",
    "data": {
      "labels": ["Jan", "Feb", "Mar"],
      "datasets": [{ "label": "Sales", "data": [100, 200, 150] }]
    }
  }'
```

### Access a chart

```bash
# Public chart — no token needed
curl http://localhost:3000/api/charts/{chart-hash}

# Private chart — pass shareToken as query param
curl "http://localhost:3000/api/charts/{chart-hash}?token=my-service-token"

# Admin access via x-api-key — works for any chart regardless of shareToken
curl http://localhost:3000/api/charts/{chart-hash} -H "x-api-key: $API_KEY"

# PNG (with token)
curl "http://localhost:3000/api/charts/{chart-hash}/png?token=my-service-token" --output chart.png

# Embed HTML
curl http://localhost:3000/api/charts/{chart-hash}/embed
```
