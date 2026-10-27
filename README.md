
## 🚀 Quick Start
### Prerequisites
- Python 3.10+
- MySQL Server 8.0+
- Node.js 18+ (optional, only needed for modifying frontend code)

### 1. Database Configuration
Create the database in MySQL:
```sql
CREATE DATABASE one_erp;
```
Set the required credentials in your environment before starting the application. In PowerShell:
```powershell
$env:DB_PASSWORD = "<your-mysql-password>"
$env:SECRET_KEY = "<a-random-secret-of-at-least-32-characters>"
$env:ADMIN_PASSWORD = "<initial-admin-password>"
```
`DB_USER`, `DB_HOST`, `DB_PORT`, and `DB_NAME` are optional and default to `root`, `localhost`, `3306`, and `one_erp`. The initial administrator is created only when `ADMIN_PASSWORD` is set.

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Run Platform
```bash
python run.py
```
- 🌐 **Full Web Application**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- 📖 **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ❤️ **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

Set `ADMIN_PASSWORD` before the first start to create the initial `admin` account. Choose a strong, unique password.

---

## 🧪 Running Tests
```bash
python backend/tests/test_full_platform.py
```
