#!/usr/bin/env python3
"""
QuickKart Server Startup Script
Runs the unified FastAPI application on port 8000.
Serves REST APIs, HTML Pages, CSS, JavaScript, and static assets directly.
"""
import uvicorn

if __name__ == "__main__":
    print("==================================================")
    print("🚀 QuickKart 10-Minute Commerce Server Starting...")
    print("📦 Serving Frontend and Backend on port 8000")
    print("🌐 Website: http://localhost:8000")
    print("📚 Swagger Docs: http://localhost:8000/docs")
    print("==================================================")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)
