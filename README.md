# CyberNova Analytics

AI-Powered Cybersecurity Analytics Platform - Full Stack Application

## Project Overview

CyberNova Analytics is a complete end-to-end application with:
- **Frontend**: Single-page application (`index.html`) with dynamic backend integration
- **Backend**: FastAPI REST API with PostgreSQL database
- **Features**: Service request management, webinar registration, admin dashboard with live metrics
- **Cyber Awareness Webinars** - Live training sessions and educational resources
- **Analytics Dashboard** - Real-time service intelligence and metrics
- **Resource Library** - Whitepapers, guides, and compliance documentation

## 🚀 Tech Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** - No build step required
- Modern dark theme UI with responsive design
- Client-side routing and JWT authentication

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Neon Serverless Database
- **JWT Authentication** - Secure token-based auth
- **SQLAlchemy ORM** - Database operations

## 📋 Prerequisites

- Python 3.10 or higher
- Git
- Neon Database account (free tier available)

## 🛠️ Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/cybernova.git
cd cybernova
```

### 2. Database Setup

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project named `cybernova`
3. Copy your connection string
4. Open Neon SQL Editor and run the schema from `backend/init_db.sql`
5. Run the admin user update from `backend/update_admin.sql`

### 3. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:

```env
DATABASE_URL=your_neon_connection_string_here
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Generate a secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Start the backend server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup

From the project root directory:

```bash
python -m http.server 3000
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 6. Login Credentials

- **Email**: admin@cybernova.com
- **Password**: Admin@123

## 📁 Project Structure

```
cybernova/
├── backend/
│   ├── app/
│   │   ├── core/          # Security, config
│   │   ├── models/        # Database models
│   │   ├── routes/        # API endpoints
│   │   ├── schemas/       # Pydantic schemas
│   │   └── main.py        # FastAPI app
│   ├── .env.example       # Environment template
│   ├── requirements.txt   # Python dependencies
│   └── init_db.sql        # Database schema
├── index.html             # Main frontend file
├── app.js                 # Frontend JavaScript
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🌐 Deployment

### Deploy to Render (Backend)

1. Push your code to GitHub
2. Go to [Render](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from your `.env` file

### Deploy to Netlify/Vercel (Frontend)

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) or [Vercel](https://vercel.com)
3. Import your repository
4. Configure:
   - **Build Command**: (leave empty)
   - **Publish Directory**: `/` (root)
5. Update `app.js` with your deployed backend URL

## 🔒 Security Notes

- **Never commit `.env` files** - They contain sensitive credentials
- **Change default admin password** after first login
- **Use strong SECRET_KEY** in production
- **Enable HTTPS** in production

## 📚 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend CORS settings include your frontend URL
- Check that both servers are running

### Database Connection Issues
- Verify Neon connection string is correct
- Ensure database schema has been created
- Check that admin user exists in database

### Login Issues
- Verify you ran `update_admin.sql` in Neon
- Check browser console for errors
- Ensure backend is running on port 8000

## 📄 License

MIT License - Feel free to use this project for your own purposes.

## 👨‍💻 Author

CyberNova Analytics Team

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## Project Structure

```
cybernova/
├── index.html              # Main frontend (enhanced with backend integration)
├── app.js                  # Frontend JavaScript with API calls
├── backend/
│   ├── app/
│   │   ├── core/          # Configuration and security (JWT, password hashing)
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routes/        # API endpoints (public, auth, admin)
│   │   ├── services/      # Business logic (dashboard metrics)
│   │   ├── utils/         # Utilities (seed data script)
│   │   ├── database.py    # Database connection
│   │   └── main.py        # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example       # Environment variables template
│   └── README.md          # Backend-specific documentation
├── SETUP_GUIDE.md         # Detailed setup instructions
├── NEON_SETUP.md          # Neon database setup guide
└── README.md              # This file
```

## Getting Started

### Running Locally

Simply open `index.html` in a modern web browser:

```bash
# Navigate to project directory
cd cybernova

# Open in default browser (Windows)
start index.html

# Or use a local development server
python -m http.server 8000
# Then visit http://localhost:8000
```

### Demo Credentials

To access the analytics dashboard:
- **Email:** admin@cybernova.co.bw
- **Password:** admin123

## Technology Stack

- **Frontend:** Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Custom CSS with CSS Variables
- **Fonts:** Google Fonts (Syne, DM Sans)
- **Charts:** Custom SVG-based visualizations
- **Architecture:** Single-page application with client-side routing

## Pages

1. **Home** - Hero section with service overview and statistics
2. **Services** - Detailed service catalog
3. **Request Assessment** - Client intake form
4. **Events & Resources** - Webinars, workshops, and downloadable resources
5. **Login** - Dashboard authentication
6. **Dashboard** - Analytics and metrics visualization

## Features Highlights

### Analytics Dashboard
- KPI tracking (service requests, registrations, conversion rates)
- Monthly service request trends
- Industry distribution visualization
- Geographic client distribution
- Conversion funnel analysis
- Customer satisfaction metrics
- 12-month trend analysis with predictive indicators

### Responsive Design
- Mobile-first approach
- Breakpoints optimized for tablets and mobile devices
- Adaptive navigation and layouts

## Color Scheme

- **Primary Background:** `#050A0E`
- **Surface:** `#0C1419`
- **Accent:** `#00C9A7` (Teal)
- **Secondary Accent:** `#0088FF` (Blue)
- **Warning:** `#FF6B35` (Orange)
- **Text:** `#E8F0F5`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend API integration
- Real-time threat monitoring dashboard
- Client portal with authentication
- Database integration for form submissions
- Email notification system
- Payment gateway integration for webinar registrations

## License

© 2025 CyberNova Analytics Ltd — Gaborone, Botswana

---

**Contact:** AI-Powered Cybersecurity for Southern Africa
