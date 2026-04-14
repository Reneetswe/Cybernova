# CyberNova Analytics - Neon Database Setup

## Why Neon?

Neon is a serverless PostgreSQL database that's perfect for this project:
- ✅ No local PostgreSQL installation needed
- ✅ Free tier available
- ✅ Auto-scaling and serverless
- ✅ Built-in connection pooling
- ✅ Instant database provisioning

## Setup Steps

### 1. Create Neon Account

1. Go to https://neon.tech
2. Sign up for a free account
3. Verify your email

### 2. Create a New Project

1. Click **"Create a project"**
2. Project name: `cybernova`
3. Database name: `cybernova` (or leave default `neondb`)
4. Region: Choose closest to you (e.g., US East, EU Central)
5. Click **"Create project"**

### 3. Get Connection String

After project creation, you'll see a connection string like:

```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/cybernova?sslmode=require
```

**Important:** Copy this entire connection string!

### 4. Configure Backend

```bash
# Navigate to backend folder
cd backend

# Create .env file from example
copy .env.example .env

# Edit .env file
notepad .env
```

Paste your Neon connection string:

```env
# Replace with your actual Neon connection string
DATABASE_URL=postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/cybernova?sslmode=require

# Generate a secure secret key
SECRET_KEY=your-generated-secret-key-here

ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 5. Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it as your `SECRET_KEY` in `.env`

### 6. Install Dependencies

```bash
pip install -r requirements.txt
```

### 7. Seed Database

The tables will be created automatically when you start the server, but you need to seed initial data:

```bash
python -m app.utils.seed_data
```

This creates:
- Admin user: `admin@cybernova.com` / `Admin@123`
- 4 sample webinars
- Sample customer feedback

### 8. Start Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`

### 9. Start Frontend

Open new terminal in project root:

```bash
cd ..
python -m http.server 3000
```

Open browser to: `http://localhost:3000`

## Verify Database Connection

### Check Tables in Neon Console

1. Go to https://console.neon.tech
2. Select your `cybernova` project
3. Click **"Tables"** in sidebar
4. You should see:
   - `admin_users`
   - `service_requests`
   - `service_request_services`
   - `webinars`
   - `webinar_registrations`
   - `customer_feedback`

### Query Data via SQL Editor

In Neon Console, click **"SQL Editor"** and run:

```sql
-- Check admin users
SELECT id, full_name, email, created_at FROM admin_users;

-- Check webinars
SELECT id, title, event_type, event_date FROM webinars;

-- Check service requests (after submitting some)
SELECT id, full_name, organization_name, status, created_at FROM service_requests;
```

## Neon-Specific Features

### Connection Pooling

Neon automatically handles connection pooling. No additional configuration needed!

### Branching (Optional)

Neon supports database branching for development:

```bash
# Create a dev branch in Neon Console
# Get the dev branch connection string
# Use it in a separate .env.dev file for testing
```

### Monitoring

In Neon Console, you can:
- View query performance
- Monitor database size
- Check connection count
- View query logs

## Troubleshooting

### "SSL connection required"

Make sure your connection string includes `?sslmode=require`:
```
DATABASE_URL=postgresql://...neon.tech/cybernova?sslmode=require
```

### "Connection timeout"

- Check your internet connection
- Verify the connection string is correct
- Check Neon project is active (not paused)

### "Database does not exist"

- Verify database name in connection string matches your Neon database
- Default Neon database is `neondb` - you can use that or create `cybernova`

### Tables not created

Tables are created automatically on first run. If they don't appear:

```bash
# Force table creation
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

## Free Tier Limits

Neon Free Tier includes:
- ✅ 0.5 GB storage
- ✅ Unlimited queries
- ✅ Auto-suspend after inactivity (saves resources)
- ✅ 1 project
- ✅ 10 branches

This is more than enough for development and testing!

## Production Deployment

For production, consider:
1. Upgrade to Neon Pro for higher limits
2. Enable connection pooling (already included)
3. Set up automated backups in Neon Console
4. Use environment-specific branches (dev, staging, prod)

## Advantages Over Local PostgreSQL

| Feature | Neon | Local PostgreSQL |
|---------|------|------------------|
| Setup time | 2 minutes | 15-30 minutes |
| Maintenance | Zero | Manual updates |
| Backups | Automatic | Manual setup |
| Scaling | Automatic | Manual |
| Cost (dev) | Free | Free |
| Access anywhere | ✅ Yes | ❌ No |

---

**You're all set with Neon!** Your database is now serverless and accessible from anywhere. 🚀
