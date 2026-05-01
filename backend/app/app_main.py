from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router import chat_rt
import os

root_path = os.getenv("ROOT_PATH", "http://localhost:8000")

app = FastAPI(root_path=root_path)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_rt.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
