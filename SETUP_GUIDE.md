# CyberNova Analytics - Setup Guide

## What Was Built

Your existing `index.html` frontend has been **enhanced** (not replaced) with:
- ✅ Backend API integration via `app.js`
- ✅ Live data from PostgreSQL database
- ✅ Admin authentication with JWT
- ✅ Service request form → saves to database
- ✅ Webinar registration → saves to database
- ✅ Dashboard metrics → pulls real data
- ✅ Admin management tables for service requests and webinar registrations

**Your UI remains exactly the same** - only the functionality is now connected to a real backend!

## Files Added/Modified

### New Files:
- `backend/` - Complete FastAPI backend
- `app.js` - JavaScript that connects your HTML to the backend APIs

### Modified Files:
- `index.html` - Added admin management tables and reference to `app.js`

## Setup Steps

### Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:
- **Windows**: Download from https://www.postgresql.org/download/windows/
- During installation, remember your postgres password

### Step 2: Create Database

Open Command Prompt or PowerShell:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cybernova;

# Exit
\q
```

### Step 3: Setup Backend

```bash
# Navigate to backend folder
cd "C:\Users\Reneetswe windows\CascadeProjects\cybernova\backend"

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env file with your database credentials
notepad .env
```

In the `.env` file, update:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cybernova
SECRET_KEY=your-secret-key-change-this
```

### Step 4: Seed Initial Data

```bash
# Still in backend folder
python -m app.utils.seed_data
```

This creates:
- Admin user: `admin@cybernova.com` / `Admin@123`
- 4 sample webinars
- Sample customer feedback

### Step 5: Start Backend Server

```bash
# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Keep this terminal open. Backend runs at `http://localhost:8000`

### Step 6: Open Frontend

Open a new terminal in the project root:

```bash
cd "C:\Users\Reneetswe windows\CascadeProjects\cybernova"

# Option 1: Simple Python server
python -m http.server 3000

# Option 2: Just open index.html directly in browser
# (but CORS might cause issues, so use option 1)
```

Open browser to: `http://localhost:3000`

## Testing the Application

### 1. Test Service Request Form
- Click "Request Assessment" in navigation
- Fill out the form
- Select at least one service
- Click "Submit Assessment Request"
- ✅ Should see success message
- ✅ Data saved to database

### 2. Test Webinar Registration
- Click "Events & Resources"
- Click "Register" on any webinar
- Enter name and email
- ✅ Should see registration confirmation
- ✅ Registration count should increase
- Try registering again with same email → should prevent duplicate

### 3. Test Admin Dashboard
- Click "Dashboard Login"
- Login with: `admin@cybernova.com` / `Admin@123`
- ✅ Should see live dashboard with real metrics
- ✅ Charts populated with actual data
- ✅ Service Request Management table shows submitted requests
- ✅ Webinar Registrations table shows registrations

### 4. Test Status Updates
- In dashboard, scroll to Service Request Management table
- Use dropdown to change a request status
- ✅ Status should update
- ✅ Dashboard metrics should refresh

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database exists: `psql -U postgres -l`
- Check `.env` file has correct DATABASE_URL

### Frontend shows CORS errors
- Make sure backend is running on port 8000
- Use `python -m http.server 3000` instead of opening HTML directly
- Check browser console for specific errors

### Login doesn't work
- Verify seed script ran successfully
- Check backend terminal for errors
- Try: `python -m app.utils.seed_data` again

### Data not showing in dashboard
- Open browser DevTools (F12) → Console tab
- Check for API errors
- Verify backend is running and accessible at `http://localhost:8000`
- Check backend terminal for request logs

## API Documentation

While backend is running, visit:
- **Interactive API Docs**: `http://localhost:8000/docs`
- **Alternative Docs**: `http://localhost:8000/redoc`

You can test all endpoints directly from the docs interface!

## Database Access

To view data directly in PostgreSQL:

```bash
psql -U postgres -d cybernova

# View tables
\dt

# View service requests
SELECT * FROM service_requests;

# View webinar registrations
SELECT * FROM webinar_registrations;

# View admin users
SELECT id, full_name, email FROM admin_users;

# Exit
\q
```

## Next Steps

1. **Customize Webinars**: Edit `backend/app/utils/seed_data.py` and re-run seed script
2. **Add More Admins**: Create new admin users via database or add to seed script
3. **Deploy**: See `backend/README.md` for production deployment guidelines
4. **Customize UI**: Your `index.html` can be styled/modified as needed - backend integration will continue working

## Support

If you encounter issues:
1. Check backend terminal for error messages
2. Check browser console (F12) for frontend errors
3. Verify all services are running (PostgreSQL, backend, frontend)
4. Review API docs at `http://localhost:8000/docs`

---

**You're all set!** Your CyberNova Analytics platform is now a fully functional end-to-end application with real backend, database, and authentication. 🚀
