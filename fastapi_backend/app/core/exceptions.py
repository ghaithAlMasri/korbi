from fastapi import Request
from fastapi.responses import JSONResponse
from openai import APIError


class DocNotFoundError(Exception):
    def __init__(self, filename: str):
        self.filename = filename


async def openai_error_handler(request: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"detail": f"OpenAI API error: {exc.message}"},
    )


async def doc_not_found_handler(request: Request, exc: DocNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": f"Not found: {exc.filename}"},
    )
