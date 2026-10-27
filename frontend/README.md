# STACKLY OneERP — React Frontend Application

This is the **React (Vite + Tailwind CSS + Lucide Icons)** frontend for the STACKLY OneERP Cloud Platform.

---

## 🚀 Two Ways to Run the React Frontend

### Option 1: Live Interactive Server (FastAPI Full Stack)
Run the root launcher:
```powershell
python run.py
```
Open **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** to access the compiled React application directly.

### Option 2: Vite Hot-Reload Development Server
If you are developing React components and want instant Hot Module Replacement (HMR):
```powershell
cd frontend
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)**. Requests to `/api` are automatically proxied to the FastAPI backend at `http://127.0.0.1:8000`.

---

## 🛠️ Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **API Client**: REST API Client communicating with `/api/v1`

