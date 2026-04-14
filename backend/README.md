# CyberNova Analytics - Backend

FastAPI backend for the CyberNova Analytics platform.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

Install PostgreSQL if not already installed. Then create a database:

```sql
CREATE DATABASE cybernova;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/cybernova
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Important:** Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Initialize Database

The database tables will be created automatically when you start the server.

### 5. Seed Initial Data

Run the seed script to create admin user and sample data:

```bash
python -m app.utils.seed_data
```

This will create:
- Admin user: `admin@cybernova.com` / `Admin@123`
- 4 webinar events
- Sample customer feedback

### 6. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### Public Endpoints

- `POST /api/service-requests` - Submit service request
- `GET /api/webinars` - Get all webinars
- `POST /api/webinar-registrations` - Register for webinar

### Admin Auth Endpoints

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get current admin info

### Admin Protected Endpoints

**Dashboard:**
- `GET /api/admin/dashboard/summary` - Dashboard summary metrics
- `GET /api/admin/dashboard/monthly-service-requests` - Monthly trends
- `GET /api/admin/dashboard/industry-distribution` - Industry breakdown
- `GET /api/admin/dashboard/geographic-distribution` - Geographic breakdown
- `GET /api/admin/dashboard/conversion-funnel` - Conversion funnel
- `GET /api/admin/dashboard/customer-satisfaction` - Satisfaction metrics

**Service Request Management:**
- `GET /api/admin/service-requests` - List all service requests
- `GET /api/admin/service-requests/{id}` - Get specific request
- `PATCH /api/admin/service-requests/{id}/status` - Update request status

**Webinar Management:**
- `GET /api/admin/webinar-registrations` - List all registrations

**Customer Feedback:**
- `POST /api/admin/customer-feedback` - Submit feedback

## Database Schema

### Tables

1. **admin_users** - Admin user accounts
2. **service_requests** - Customer service requests
3. **service_request_services** - Services selected per request
4. **webinars** - Webinar/workshop events
5. **webinar_registrations** - Webinar registrations
6. **customer_feedback** - Customer satisfaction feedback

## Development

### Project Structure

```
backend/
├── app/
│   ├── core/           # Configuration and security
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utilities and seed data
│   ├── database.py     # Database configuration
│   └── main.py         # FastAPI application
├── requirements.txt
├── .env.example
└── README.md
```

### Testing

Access the interactive API documentation at `http://localhost:8000/docs` to test all endpoints.

## Production Deployment

1. Use a production-grade WSGI server (already using uvicorn)
2. Set strong SECRET_KEY
3. Use environment variables for sensitive data
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up database backups
7. Use connection pooling for database
8. Add rate limiting
9. Set up monitoring and logging
