import os
import sys
import socket
import uvicorn


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
APP_DIR = os.path.join(BACKEND_DIR, "app")

for path in (BASE_DIR, BACKEND_DIR, APP_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)


def get_available_port(preferred_port: int = 8000) -> int:
    """Finds an available port starting with preferred_port."""
    for p in range(preferred_port, preferred_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", p)) != 0:
                return p
    return preferred_port


if __name__ == "__main__":
    configured_port = int(os.getenv("PORT", 0)) or get_available_port(8000)

    print("\n" + "=" * 65)
    print("🚀 STACKLY SAP OneERP Cloud Platform")
    print(f"🌐 Full Web Application:  http://127.0.0.1:{configured_port}/")
    print(f"📖 OpenAPI / Swagger Docs: http://127.0.0.1:{configured_port}/docs")
    print(f"❤️  Health Check Endpoint: http://127.0.0.1:{configured_port}/api/health")
    print("=" * 65 + "\n")
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=configured_port, reload=True)
