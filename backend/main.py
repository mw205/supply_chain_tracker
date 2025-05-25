import os  # <<< ADD THIS IMPORT

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <<< ADD THIS IMPORT

from .routers import events, products

# from .database import engine # Not directly used for app setup here

app = FastAPI(
    title="Supply Chain Tracker API",
    description="API for tracking products and their supply chain events using a blockchain. The UI is served from the root.", # Updated description
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
app.include_router(products.router) # e.g., accessible at /products
app.include_router(events.router)   # e.g., accessible at /events

# --- Serve Static Frontend Files ---
# Determine the absolute path to the 'frontend' directory.
# 'main.py' is in 'backend/', so we construct the path like '../frontend'.
current_script_dir = os.path.dirname(os.path.abspath(__file__))
# Go one level up from 'backend/' to the project root, then into 'frontend/'
frontend_dir = os.path.normpath(os.path.join(current_script_dir, "..", "frontend"))

if not os.path.isdir(frontend_dir):
    print(f"ERROR: Frontend directory not found at {frontend_dir}")
    print("Please ensure the 'frontend' folder exists at the root of your project, alongside the 'backend' folder.")
    # You might want to raise an exception here or handle this more gracefully
else:
    # Mount static files from the 'frontend' directory to be served at the root ('/').
    # 'html=True' allows 'index.html' (if present in frontend_dir) to be served when accessing '/'.
    # This line should be AFTER all your API routes.
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static_frontend")

# The original @app.get("/") route that returned a JSON message is no longer needed here,
# as StaticFiles mounted at "/" with html=True will handle serving index.html for the root path.
# If you had an @app.get("/") route defined earlier, you can remove it or ensure it's before the mount.
# The API documentation (Swagger UI) will still be available at /docs and /redoc (FastAPI defaults).