from typing import Optional, Dict

from pydantic import BaseModel


class LLMOutput(BaseModel):
    summary_md: str
    route: Dict[str, Optional[str]]  # {"notebook": "Work", "section": "Meetings"}
    raw: Optional[str] = None
