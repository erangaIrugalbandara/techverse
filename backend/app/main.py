from fastapi import FastAPI

app = FastAPI(title="Techverse Blog API")


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}
