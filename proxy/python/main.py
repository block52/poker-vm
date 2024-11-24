# Create a fast api
import json
import os
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from models.account import Account
from RPCClient import RPCClient

load_dotenv()
app = FastAPI(
    title="Block 52 Proxy API",
    description="API for Block 52 Proxy",
    version="0.1.0",
)

origins = [
    "*",
    "http://localhost",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello Poker World!"}


@app.get("/account/{account}", response_model=Account)
def get_account(account: str) -> Account:
    account = Account(account)
    return account


@app.get("/account/{account}/balance", response_model=float)
def get_account(account: str) -> float:
    client = RPCClient("https://node1.block52.xyz")
    response = client.call_json_rpc("get_account", [])
    account = Account(account)
    return account


if __name__ == "__main__":
    # PORT = os.getenv("PORT", 8000)
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

    