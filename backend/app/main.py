from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine, Base
from app.routes import public, auth, admin

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="CyberNova Analytics API",
    description="AI-Powered Cybersecurity Analytics Platform",
    version="1.0.0"
)

# Configure CORS - Allow ALL origins for development (no restrictions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(public.router, prefix="/api", tags=["Public"])
app.include_router(auth.router, prefix="/api/admin/auth", tags=["Admin Auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def root():
    return {
        "message": "CyberNova Analytics API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
