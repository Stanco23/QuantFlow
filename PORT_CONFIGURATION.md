# Port Configuration Guide

This document explains the port configuration for the QuantFlow application to ensure proper service separation and avoid port conflicts.

## Port Assignments

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Next.js) | 3000 | React application serving the UI |
| Backend (Express API) | 3001 | REST API server handling backend logic |

## Configuration Files

### Backend Configuration
- **File**: `backend/.env`
- **Port Setting**: `PORT=3001`
- **Server**: `backend/src/server.ts` defaults to port 3001

### Frontend Configuration
- **File**: `frontend/.env.local`
- **Port Setting**: `PORT=3000`
- **API URL**: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- **Next.js Config**: `frontend/next.config.ts` sets API URL fallback

## Build Scripts

The root `package.json` has been updated with explicit port assignments:

```json
{
  "scripts": {
    "dev:backend": "PORT=3001 npm run dev --workspace=backend",
    "dev:frontend": "npm run dev --workspace=frontend",
    "start:backend": "PORT=3001 npm run start --workspace=backend",
    "start:frontend": "npm run start --workspace=frontend"
  }
}
```

## Development Usage

### Start Both Services
```bash
# Development mode
npm run dev

# Quick development (no shared build)
npm run dev:quick

# Production mode
npm run start
```

### Start Individual Services
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

## Troubleshooting

### Port Already In Use
If you encounter "Port already in use" errors:

1. Check running processes:
   ```bash
   lsof -i :3000
   lsof -i :3001
   ```

2. Kill processes if needed:
   ```bash
   kill -9 <PID>
   ```

3. Verify environment variables:
   ```bash
   # In backend directory
   cat .env
   
   # In frontend directory
   cat .env.local
   ```

### Service Connection Issues
If frontend can't connect to backend:

1. Verify backend is running on port 3001:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check frontend API URL configuration in `next.config.ts`

3. Verify CORS configuration in backend allows frontend origin

## Environment Variables

### Backend (.env)
```env
PORT=3001
BYBIT_API_KEY=your_api_key
BYBIT_API_SECRET=your_api_secret
BYBIT_TESTNET=true
DATABASE_URL=sqlite:./data/quantflow.db
```

### Frontend (.env.local)
```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Production Deployment

For production deployments, ensure:

1. Environment variables are properly set
2. Load balancer routes traffic to correct ports
3. Firewall rules allow traffic on both ports
4. Services start in correct order (backend before frontend)

## Notes

- The frontend defaults to port 3000 (standard Next.js port)
- The backend uses port 3001 to avoid conflicts
- Both services can be customized via environment variables
- The configuration ensures deterministic port assignment regardless of startup order
