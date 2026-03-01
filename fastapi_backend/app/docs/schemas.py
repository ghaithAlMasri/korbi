from pydantic import BaseModel


class SaveRequest(BaseModel):
    changes: list[dict]
