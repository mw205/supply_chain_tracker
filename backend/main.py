import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
# Import engine for table creation
from .database import engine
# Import your routers
from .routers import auth as auth_router  # Import the new auth router
from .routers import events, products

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Supply Chain Tracker API",
    description="API for tracking products and their supply chain events using a blockchain. The UI is served from the root.",
    version="0.1.0"
)

# CORS configuration - still useful
origins = [
    "http://localhost",
    "http://localhost:8000", # Default for FastAPI if served on this port
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://localhost:3000", # Common for other frontend dev servers
    "null", # For file:/// access if it was ever used (less relevant now)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
# These specific API routes MUST be defined BEFORE the general static file serving
# to ensure they are matched first by FastAPI.
app.include_router(products.router)
app.include_router(events.router)
app.include_router(auth_router.router)

# --- Serve Static Frontend Files ---
# Determine the absolute path to the 'frontend' directory.
# 'main.py' is in 'backend/', so we construct the path like '../frontend'.
current_script_dir = os.path.dirname(os.path.abspath(__file__))
# Go one level up from 'backend/' to the project root, then into 'frontend/'
frontend_dir = os.path.normpath(os.path.join(current_script_dir, "..", "frontend"))

if not os.path.isdir(frontend_dir):
    print(f"ERROR: Frontend directory not found at {frontend_dir}")
else:
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static_frontend")
