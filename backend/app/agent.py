from typing import TypedDict, Optional, Dict, Any
from langgraph.graph import StateGraph, END
import json, re, os
from app.llm import get_llm
from app.tools.ocr import ocr_image
from app.tools.stt import transcribe_audio
from app.tools.onenote import write_summary_to_onenote, get_notebook_section_map, list_notebooks
from app.schemas import LLMOutput
from pydantic import ValidationError

# ---------- Agent State ----------
class AgentState(TypedDict, total=False):
    mode: str                     # "text" | "image" | "audio"
    text: Optional[str]
    ocr_text: Optional[str]
    stt_text: Optional[str]
    summary: Optional[str]
    route_notebook: Optional[str]
    route_section: Optional[str]

llm = get_llm()

def _extract_json(text: str) -> Optional[str]:
    """Extract the first top-level JSON object using balanced braces.

    Avoids unsupported recursive regex extensions like (?R) in Python's re.
    Handles quotes and escapes to not count braces inside strings.
    """
    s = text
    n = len(s)
    i = 0
    # Find first '{'
    while i < n and s[i] != '{':
        i += 1
    if i >= n:
        s_strip = text.strip()
        if s_strip.startswith('{') and s_strip.endswith('}'):
            return s_strip
        return None

    brace = 0
    in_str = False
    esc = False
    start = i
    while i < n:
        ch = s[i]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == '{':
                brace += 1
            elif ch == '}':
                brace -= 1
                if brace == 0:
                    return s[start:i+1]
        i += 1
    return None

def build_structured_prompt(input_text: str, notebook_map: Dict[str, list]) -> str:
    """
    notebook_map: {"Work": ["Meetings","Projects"], "Personal": ["Tasks","Journal"], ...}
    We'll give the LLM explicit allowed values and a JSON schema example.
    """
    # Build options string
    options_lines = []
    for nb, secs in notebook_map.items():
        opts = ", ".join(f'"{s}"' for s in secs)
        options_lines.append(f'- Notebook "{nb}" with sections: {opts}')
    options_text = "\n".join(options_lines) if options_lines else "No notebooks found."

    prompt = f"""
You are an assistant that MUST produce a JSON object following this schema exactly:

{{
  "summary_md": "<string: a short markdown summary (bulleted list) of the note>",
  "route": {{
    "notebook": "<string: choose EXACTLY one notebook name from the available options>",
    "section": "<string: choose EXACTLY one section name that exists inside the chosen notebook>"
  }},
  "raw": "<optional: you may include the original text or extra debug info>"
}}

Available notebooks & sections:
{options_text}

Now analyze the following note/transcript/text and produce the JSON ONLY (no extra commentary):

--- NOTE START ---
{input_text}
--- NOTE END ---

Make sure:
- `notebook` and `section` are exact matches to the listed options (case-sensitive is OK but prefer exact words).
- `summary_md` is 3-7 concise bullets in markdown (each bullet prefixed with '-' or '*').
- Output valid JSON only.
"""
    return prompt

def call_llm_structured(input_text: str) -> LLMOutput:
    # fetch notebook inventory
    nb_map = get_notebook_section_map()
    prompt = build_structured_prompt(input_text, nb_map)

    resp = llm.invoke(prompt)  # returns a string
    # try to extract JSON and validate
    json_text = _extract_json(resp)
    if json_text:
        try:
            # pydantic v2: use model_validate if available
            try:
                validated = LLMOutput.model_validate_json(json_text)  # v2
            except Exception:
                # fallback to v1-compatible
                validated = LLMOutput.parse_raw(json_text)
            return validated
        except ValidationError as e:
            # include raw in fallback summary
            return LLMOutput(summary_md=f"(parsable but invalid schema) {resp[:200]}", route={"notebook": None, "section": None}, raw=resp)
    else:
        # No JSON found — provide fallback: ask LLM to reformat strictly (retry once)
        retry_prompt = "Your previous output was not valid JSON. Please respond with JSON only using the schema described previously. Here is the original output:\n\n" + resp + "\n\nNow output JSON only."
        resp2 = llm.invoke(retry_prompt)
        json_text2 = _extract_json(resp2)
        if json_text2:
            try:
                try:
                    validated = LLMOutput.model_validate_json(json_text2)  # v2
                except Exception:
                    validated = LLMOutput.parse_raw(json_text2)
                return validated
            except ValidationError:
                return LLMOutput(summary_md=f"(invalid schema after retry) {resp2[:200]}", route={"notebook": None, "section": None}, raw=resp2)
        # final fallback: return raw text as summary
        return LLMOutput(summary_md=resp[:200], route={"notebook": None, "section": None}, raw=resp)

# ---------- Nodes ----------
def router(state: AgentState) -> AgentState:
    # expect caller to set mode, but fallback if not
    if "mode" not in state or not state["mode"]:
        if state.get("ocr_text"): state["mode"] = "image"
        elif state.get("stt_text"): state["mode"] = "audio"
        else: state["mode"] = "text"
    return state

def handle_text(state: AgentState) -> AgentState:
    assert state.get("text")
    
    # Use the new structured LLM call
    try:
        result = call_llm_structured(state["text"])
        state["summary"] = result.summary_md
        state["route_notebook"] = result.route.get("notebook")
        state["route_section"] = result.route.get("section")
        return state
    except Exception:
        # Fallback to simple summarization if structured approach fails
        prompt = (
            "You are an assistant that summarizes into 5 crisp bullets and recommends the best OneNote destination.\n"
            "Return JSON with keys: summary_md (markdown bullets) and route {notebook, section}.\n\n"
            f"TEXT:\n{state['text']}"
        )
        resp = llm.invoke(prompt)
        # Try to extract JSON using balanced-brace extractor
        match_text = _extract_json(resp)
        if match_text:
            try:
                data = json.loads(match_text)
                state["summary"] = data.get("summary_md") or state["text"][:500]
                route = data.get("route") or {}
                state["route_notebook"] = route.get("notebook")
                state["route_section"] = route.get("section")
                return state
            except Exception:
                # If JSON parse fails, fall through to minimal summary
                pass
        # fallback: minimal summary
        state["summary"] = resp.strip()[:2000]
        return state

def handle_image(state: AgentState) -> AgentState:
    # ocr_text should already be set by caller; otherwise do nothing
    text = state.get("ocr_text") or ""
    prompt = (
        "Summarize the following OCR text into 5 crisp bullets and extract TODOs as '- [ ] ...' lines.\n\n"
        f"{text}"
    )
    state["summary"] = llm.invoke(prompt)
    return state

def handle_audio(state: AgentState) -> AgentState:
    text = state.get("stt_text") or ""
    prompt = (
        "Summarize meeting transcript in bullets, include decisions and action items. "
        "Return compact markdown.\n\n"
        f"{text}"
    )
    state["summary"] = llm.invoke(prompt)
    return state

def write_onenote_node(state: AgentState) -> AgentState:
    summary = state.get("summary") or ""
    nb = state.get("route_notebook")
    sec = state.get("route_section")
    try:
        write_summary_to_onenote(summary, notebook=nb, section=sec)
    except Exception as e:
        # write failure shouldn’t kill response
        state["summary"] += f"\n\n> ⚠️ Failed to write to OneNote: {e}"
    return state

# ---------- Graph ----------
def build_workflow():
    g = StateGraph(AgentState)
    g.add_node("router", router)
    g.add_node("handle_text", handle_text)
    g.add_node("handle_image", handle_image)
    g.add_node("handle_audio", handle_audio)
    g.add_node("write_onenote", write_onenote_node)

    g.set_entry_point("router")
    # simple routing by mode
    g.add_conditional_edges(
        "router",
        lambda s: s.get("mode"),
        {
            "text": "handle_text",
            "image": "handle_image",
            "audio": "handle_audio",
        },
    )
    # After handling, always try writing to OneNote
    g.add_edge("handle_text", "write_onenote")
    g.add_edge("handle_image", "write_onenote")
    g.add_edge("handle_audio", "write_onenote")
    g.add_edge("write_onenote", END)
    return g.compile()

# Singleton
_workflow = None
def get_workflow():
    global _workflow
    if _workflow is None:
        _workflow = build_workflow()
    return _workflow
