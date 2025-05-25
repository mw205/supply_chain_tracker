# Supply Chain Tracker with Blockchain Integration

This project implements a supply chain tracking application featuring a Python FastAPI backend, a custom Python blockchain for event logging, and a basic HTML/CSS/JavaScript frontend. The application uses environment variables for configuration and serves the frontend user interface directly.

## Project Overview

The system allows for the creation and management of products (stored off-chain in an SQL database) and the recording of supply chain events (e.g., shipped, received) onto a blockchain. This ensures that event data is immutable, traceable, and verifiable.

**Key Features:**

* **Product Management:** CRUD operations for products (name, SKU, description).
* **Blockchain Event Logging:** Supply chain events are recorded as transactions in blocks on a custom-built blockchain.
* **Proof of Work:** A simple PoW consensus mechanism is used to secure the blockchain when adding new blocks.
* **Data Integrity & Traceability:** Blockchain ensures event logs cannot be tampered with and provides a clear history.
* **RESTful API:** FastAPI backend provides endpoints for all operations.
* **Integrated Web Interface:** Basic frontend served directly by FastAPI for interacting with the system.
* **Configurable Settings:** Uses a `.env` file for database URL and blockchain difficulty.

## Technology Stack

* **Backend:** Python, FastAPI, SQLAlchemy (with SQLite by default)
* **Blockchain:** Custom Python implementation (Block, Blockchain, Proof of Work)
* **Frontend:** HTML, CSS, JavaScript (vanilla)
* **Database:** SQLite (default, configurable via `.env` for PostgreSQL)
* **Configuration:** `python-dotenv`, `pydantic-settings`

## Project Structure

```
supply_chain_tracker/  <-- Project Root
├── backend/
│   ├── __init__.py
│   ├── main.py             # FastAPI app instance (serves API & frontend)
│   ├── config.py           # Pydantic settings, loads .env
│   ├── database.py         # SQLAlchemy setup
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── crud.py             # CRUD operations
│   └── routers/
│       ├── __init__.py
│       └── products.py     # Product related routes
│       └── events.py       # Blockchain event routes
├── blockchain/
│   ├── __init__.py
│   └── core.py             # Blockchain logic (Block, Blockchain classes)
├── frontend/
│   ├── index.html          # Main frontend page
│   ├── style.css
│   └── app.js
├── .env.example            # Example environment variables file
├── .gitignore              # Specifies intentionally untracked files by Git
├── requirements.txt        # Python dependencies
└── README.md               # This file
└── supply_chain.db         # SQLite DB file (created after backend runs, if using SQLite)
└── venv/                   # Python virtual environment (if created with this name)
```

## Setup and Running the Application (Step-by-Step)

To get the application up and running:

### 1. Clone the Repository (or Create Files)

If this were a Git repository:

```bash
git clone <repository_url>
cd supply_chain_tracker
```

Otherwise, create the directory structure and files as described in the "Project Structure" section.

### 2. Set Up Python Virtual Environment

It's highly recommended to use a virtual environment to manage project dependencies.

**a. Navigate to the Project Root Directory:**
Open your terminal or command prompt and ensure you are in the `supply_chain_tracker` directory.

```bash
cd path/to/supply_chain_tracker
```

**b. Create the Virtual Environment:**
If you don't have one already for this project:

```bash
python -m venv venv
```

This creates a `venv` folder in your project directory.

**c. Activate the Virtual Environment:**

* On macOS/Linux:

  ```bash
  source venv/bin/activate
  ```

* On Windows (Command Prompt):

  ```bash
  venv\Scripts\activate
  ```

* On Windows (PowerShell):

  ```bash
  .\venv\Scripts\Activate.ps1
  ```

Your terminal prompt should now indicate that the virtual environment is active (e.g., `(venv) your-prompt$`).

### 3. Install Python Dependencies

With the virtual environment activated, install the required Python packages:

```bash
pip install -r requirements.txt
```

Ensure your `requirements.txt` file includes at least:

```
fastapi
uvicorn[standard]
sqlalchemy
pydantic
python-dotenv
pydantic-settings
# psycopg2-binary # Uncomment or add if you plan to use PostgreSQL
```

### 4. Configure Environment Variables (.env file)

The application uses a `.env` file to manage configurations like the database URL and blockchain difficulty.

**a. Create the `.env` file:**
In the project root directory (`supply_chain_tracker/`), copy the example environment file to a new file named `.env`:

```bash
cp .env.example .env
```

If you don't have `cp` (e.g., on Windows CMD without Git Bash), manually copy `.env.example` and rename the copy to `.env`.

**b. Review/Edit `.env` (Optional for basic SQLite setup):**
Open the newly created `.env` file. For the default SQLite setup, the initial content from `.env.example` is usually fine:

```ini
# .env
DATABASE_URL="sqlite:///./supply_chain.db"
BLOCKCHAIN_DIFFICULTY="2"
# SECRET_KEY="your_very_strong_secret_key_here" # (Currently unused but good for future auth)
```

* If you want to change the blockchain mining difficulty, modify `BLOCKCHAIN_DIFFICULTY`.

The `backend/config.py` file is set up to read these variables.

### 5. Run the Application (Backend and Frontend Server)

The FastAPI backend now also serves the frontend static files.

From the **project root directory** (`supply_chain_tracker/`), with your virtual environment still active, run:

```bash
uvicorn backend.main:app --reload
```

* `--reload`: Enables auto-reloading when code changes (useful for development).

You should see output indicating the Uvicorn server is running, similar to:

```
INFO:     Uvicorn running on [http://127.0.0.1:8000](http://127.0.0.1:8000) (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using statreload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Keep this terminal window open. Press `CTRL+C` to stop the server.

### 6. Access the Application

Open your web browser and navigate to:
`http://localhost:8000`

You should see the "Supply Chain Tracker" web interface directly. You can now interact with the application: add products, record events, and view blockchain information.

### 7. Access API Documentation (Swagger UI)

FastAPI automatically generates interactive API documentation. This is useful for developers or for testing API endpoints directly.
Navigate to:
`http://localhost:8000/docs`

## API Endpoints Summary (via Swagger UI at /docs)

**Products (Off-Chain Metadata):**

* `POST /products/`: Create a new product.
* `GET /products/`: Get a list of all products.
* `GET /products/{product_id}`: Get details of a specific product.
* `PUT /products/{product_id}`: Update an existing product.
* `DELETE /products/{product_id}`: Delete a product (off-chain data only).

**Blockchain Events (On-Chain):**

* `POST /events/record`: Record a new supply chain event onto the blockchain (triggers mining).
* `GET /events/history/{product_id}`: Retrieve the blockchain-verified event history for a specific product.
* `GET /events/blockchain/info`: Get information about the entire blockchain (chain, validity, difficulty).
* `POST /events/blockchain/validate`: Trigger a validation check of the blockchain's integrity.

## Further Development & Considerations

* **Blockchain Persistence:** The current Python blockchain is in-memory and resets on server restart. For persistence:
  * Save/load the chain to/from a file (e.g., JSON).
  * Store blocks in a dedicated database table.
* **User Authentication & Roles:** Implement robust authentication (e.g., OAuth2 with JWT using the `SECRET_KEY` from `.env`) and role-based access control.
* **Advanced Consensus:** For a distributed environment, explore more robust consensus mechanisms.
* **Frontend Enhancements:** Improve UI/UX, add more detailed views, filtering, and potentially real-time updates.
* **Scalability & Performance:** Optimize database queries, blockchain operations.
* **Testing:** Add unit and integration tests.
* **Deployment:** Containerize with Docker, deploy to a cloud platform.
* **Distributed Nodes:** For a true decentralized blockchain, implement P2P networking.

This project provides a foundational understanding of how blockchain can be integrated into a supply chain application for enhanced data integrity and traceability.
