# app/routers/agent_routes.py
import os, uuid
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.agent import get_workflow  # if you use workflow; otherwise call call_llm_structured directly
from app.tools.ocr import ocr_image
from app.tools.stt import transcribe_audio
from app.tools.onenote import write_summary_to_onenote, get_notebook_section_map
from app.agent import call_llm_structured  # function we added above

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(
    text: str = Form(None),
    file: UploadFile | None = File(None),
    mode: str = Form(None),               # allow client to say "image" or "audio" or "text" optional
    target_notebook: str = Form(None),    # optional override
    target_section: str = Form(None),
):
    try:
        input_text = None
        used_mode = mode

        # handle file uploads
        if file:
            tmp_path = f"tmp_{uuid.uuid4().hex}_{file.filename}"
            with open(tmp_path, "wb") as f:
                f.write(await file.read())

            # Attempt to auto-detect file type if mode not provided
            if not used_mode:
                if file.content_type.startswith("image/"):
                    used_mode = "image"
                elif file.content_type.startswith("audio/"):
                    used_mode = "audio"

            if used_mode == "image":
                input_text = ocr_image(tmp_path)
            elif used_mode == "audio":
                input_text = transcribe_audio(tmp_path)
            else:
                # default fallback: treat as text artifact if possible
                input_text = file.filename
            # cleanup
            try: os.remove(tmp_path)
            except: pass

        # if text provided directly
        if text:
            input_text = text
            used_mode = used_mode or "text"

        if not input_text:
            return JSONResponse({"error": "No input provided"}, status_code=400)

        # If user provided explicit target notebook/section, bypass LLM routing and use them.
        if target_notebook and target_section:
            # Summarize only, then write with user-specified route
            llm_prompt = f"Summarize into 4-6 bullet points (markdown):\n\n{input_text}"
            # you can call llm.invoke directly or reuse call_llm_structured but here simpler:
            from app.llm import get_llm
            llm = get_llm()
            summary = llm.invoke(llm_prompt)
            write_summary_to_onenote(summary, notebook=target_notebook, section=target_section)
            return {"summary": summary, "notebook": target_notebook, "section": target_section}

        # Normal flow: ask LLM to summarize and pick notebook/section from real inventory
        llm_structured = call_llm_structured(input_text)
        # If LLM gave a route, verify it exists in inventory; if not, fallback choose default
        nb_map = get_notebook_section_map()
        
        # Handle case where route might be a dict or have attributes
        if hasattr(llm_structured.route, 'get'):
            nb_choice = llm_structured.route.get("notebook")
            sec_choice = llm_structured.route.get("section")
        else:
            nb_choice = getattr(llm_structured.route, "notebook", None)
            sec_choice = getattr(llm_structured.route, "section", None)

        valid_choice = False
        if nb_choice and nb_choice in nb_map:
            if sec_choice and sec_choice in nb_map[nb_choice]:
                valid_choice = True

        if not valid_choice:
            # Use environment defaults first, then fallback to first available
            default_nb = os.getenv("DEFAULT_NOTEBOOK")
            default_sec = os.getenv("DEFAULT_SECTION")
            
            if default_nb and default_nb in nb_map and default_sec and default_sec in nb_map[default_nb]:
                nb_choice, sec_choice = default_nb, default_sec
            elif nb_map:
                nb_choice = list(nb_map.keys())[0]
                sec_choice = nb_map[nb_choice][0] if nb_map[nb_choice] else None
            else:
                nb_choice, sec_choice = None, None

        # write to OneNote if possible
        if nb_choice and sec_choice:
            write_summary_to_onenote(llm_structured.summary_md, notebook=nb_choice, section=sec_choice)
        # respond with structured output
        return {
            "summary_md": llm_structured.summary_md,
            "route": {"notebook": nb_choice, "section": sec_choice},
            "raw_llm": llm_structured.raw,
        }

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@router.get("/notebooks")
async def get_notebooks():
    """Get available OneNote notebooks and sections"""
    try:
        nb_map = get_notebook_section_map()
        # Convert to the format expected by frontend
        notebooks = []
        for notebook_name, sections in nb_map.items():
            notebooks.append({
                "notebook": notebook_name,
                "sections": sections
            })
        return notebooks
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
