# Chart Service

A high-performance microservice for generating, storing, and serving interactive charts using Chart.js and Node.js.

## Features

- 🚀 **High Performance**: Supports 1000+ chart generations per day
- 📊 **Multiple Chart Types**: Line, bar, pie, doughnut, radar, scatter, and more
- 🔒 **Secure**: JWT authentication for chart generation, public access for charts
- 🎨 **Customizable**: Multiple themes, custom dimensions, and styling options
- 📦 **Containerized**: Docker support with production-ready deployments
- ☁️ **Scalable**: Kubernetes deployment with horizontal scaling

## Quick Start

### Using Docker Compose (Development)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chart-service
   ```

2. **Start the services**

   ```bash
   docker-compose up -d
   ```

3. **The service will be available at:**

   - API: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

### Manual Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start**

   ```bash
   npm run build
   npm start
   ```

## API Documentation

### Authentication

Chart generation requires JWT authentication:

```bash
curl -X POST http://localhost:3000/api/charts/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chart_type": "line",
    "chart_data": {
      "labels": ["Jan", "Feb", "Mar"],
      "datasets": [{
        "label": "Sales",
        "data": [10, 20, 30]
      }]
    }
  }'
```

### Generate Chart

`POST /api/charts/generate`

**Request Body:**

```json
{
  "title": "Sales Chart",
  "description": "Monthly sales data",
  "chart_type": "line",
  "chart_data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{
      "label": "Sales",
      "data": [10, 20, 30],
      "backgroundColor": "#3b82f6",
      "borderColor": "#3b82f6"
    }]
  },
  "width": 800,
  "height": 600,
  "theme": "light",
  "is_public": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "chart_hash": "abc123...",
    "title": "Sales Chart",
    "chart_type": "line",
    "width": 800,
    "height": 600,
    "theme": "light",
    "is_public": false,
    "created_at": "2024-01-01T00:00:00Z",
    "access_url": "http://localhost:3000/charts/abc123...",
    "embed_url": "http://localhost:3000/charts/abc123.../embed",
    "png_url": "http://localhost:3000/api/charts/abc123.../png",
    "json_url": "http://localhost:3000/api/charts/abc123.../json"
  }
}
```

### Get Chart Information

`GET /api/charts/:hash`

Returns chart metadata and access URLs.

### Get PNG Image

`GET /api/charts/:hash/png`

Returns the chart as a PNG image.

### Get Chart Data

`GET /api/charts/:hash/json`

Returns the chart data as JSON.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `chart_service` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `JWT_SECRET` | - | JWT signing secret (required) |
| `JWT_EXPIRES_IN` | `24h` | JWT expiration time |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |
| `LOG_LEVEL` | `info` | Logging level |
| `REDIS_URL` | - | Redis URL for caching |

## Deployment

### Production Deployment

1. **Build the Docker image**

   ```bash
   docker build -t chart-service:latest .
   ```

2. **Deploy to Kubernetes**\

   ```bash
   kubectl apply -f kubernetes/deployment.yml
   ```

3. **Update secrets**

   ```bash
   kubectl create secret generic chart-service-secrets \
     --from-literal=DB_HOST=your-db-host \
     --from-literal=DB_PASSWORD=your-db-password \
     --from-literal=JWT_SECRET=your-jwt-secret \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

### Scaling

The service supports horizontal scaling:

```bash
# Scale to 5 replicas
kubectl scale deployment chart-service --replicas=5
```

## Monitoring

### Health Checks

- **Health Check**: `GET /api/health`
- **Detailed Health**: `GET /api/health/detailed`

### Logging

Logs are written to

- Development: Console + `logs/` directory
- Production: `logs/` directory in container

## Security Features

- JWT authentication for chart generation
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- SQL injection prevention

## Performance

- **Chart Generation**: ~2-5 seconds per chart (depending on complexity)
- **Concurrent Users**: Supports hundreds of concurrent requests
- **Caching**: Redis integration for session storage
- **Database**: Connection pooling with PostgreSQL

## Troubleshooting

### Common Issues

1. **Chart generation timeout**
   - Increase Puppeteer timeout in configuration
   - Check available memory

2. **Database connection errors**
   - Verify database credentials
   - Check network connectivity

3. **High memory usage**
   - Monitor chart generation load
   - Scale horizontally if needed

### Debug Mode

Set `NODE_ENV=development` and `LOG_LEVEL=debug` for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
