# app/tools/onenote.py  (add these or replace existing)

import requests
import os
from datetime import datetime
from app.utils.msal_device import get_graph_token
from typing import List, Dict

GRAPH_BASE = "https://graph.microsoft.com/v1.0"

def _headers():
    return {"Authorization": f"Bearer {get_graph_token()}"}

def list_notebooks() -> List[Dict]:
    r = requests.get(f"{GRAPH_BASE}/me/onenote/notebooks", headers=_headers())
    if r.status_code == 401:
        raise RuntimeError(f"Unauthorized (401) when listing notebooks. Ensure API permissions and consent are granted. Response: {r.text}")
    r.raise_for_status()
    return r.json().get("value", [])

def list_sections(notebook_id: str) -> List[Dict]:
    r = requests.get(f"{GRAPH_BASE}/me/onenote/notebooks/{notebook_id}/sections", headers=_headers())
    if r.status_code == 401:
        raise RuntimeError(f"Unauthorized (401) when listing sections. Response: {r.text}")
    r.raise_for_status()
    return r.json().get("value", [])

def get_notebook_section_map() -> dict:
    """
    Returns mapping: { "Notebook Name": ["Section1", "Section2", ...], ... }
    """
    mapping = {}
    nbs = list_notebooks()
    for nb in nbs:
        nb_name = nb["displayName"]
        secs = list_sections(nb["id"])
        mapping[nb_name] = [s["displayName"] for s in secs]
    return mapping

def write_summary_to_onenote(content: str, notebook: str = None, section: str = None):
    """Write content to OneNote page"""
    
    # Get default values from environment if not provided
    if not notebook:
        notebook = os.getenv("DEFAULT_NOTEBOOK", "Personal")
    if not section:
        section = os.getenv("DEFAULT_SECTION", "Tasks")
    
    # Find notebook and section IDs
    notebooks = list_notebooks()
    target_nb_id = None
    for nb in notebooks:
        if nb["displayName"] == notebook:
            target_nb_id = nb["id"]
            break
    
    if not target_nb_id:
        raise ValueError(f"Notebook '{notebook}' not found")
    
    sections = list_sections(target_nb_id)
    target_sec_id = None
    for sec in sections:
        if sec["displayName"] == section:
            target_sec_id = sec["id"]
            break
    
    if not target_sec_id:
        raise ValueError(f"Section '{section}' not found in notebook '{notebook}'")
    
    # Create page content in OneNote format
    # Keep page HTML minimal to avoid large payloads
    safe = content.replace("\n", "<br>")
    html_content = (
        "<!DOCTYPE html>\n"
        "<html><head>"
        f"<title>AI Summary - {datetime.now().strftime('%Y-%m-%d %H:%M')}</title>"
        "</head><body>"
        f"<div>{safe}</div>"
        "</body></html>"
    )
    
    # POST to create new page
    url = f"{GRAPH_BASE}/me/onenote/sections/{target_sec_id}/pages"
    headers = {**_headers(), "Content-Type": "text/html"}
    
    response = requests.post(url, headers=headers, data=html_content)
    if response.status_code == 401:
        raise RuntimeError(f"Unauthorized (401) when creating page. Response: {response.text}")
    response.raise_for_status()
    return response.json()
