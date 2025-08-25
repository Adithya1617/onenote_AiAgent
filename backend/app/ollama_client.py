import os
import requests
from typing import Optional, Dict, Any


class SimpleOllamaLLM:
    """Minimal Ollama client with an invoke(prompt) API.

    Uses the REST API so we can pass options like num_gpu=0 to force CPU
    when GPUs are low on memory.
    """

    def __init__(
        self,
        model: str,
        base_url: Optional[str] = None,
        force_cpu: bool = False,
        num_gpu_layers: Optional[int] = None,
        temperature: Optional[float] = None,
        extra_options: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.model = model
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").rstrip("/")
        self.force_cpu = force_cpu
        self.num_gpu_layers = num_gpu_layers
        self.temperature = temperature
        self.extra_options = extra_options or {}

    def _options(self) -> Dict[str, Any]:
        opts: Dict[str, Any] = {}
        if self.force_cpu:
            # With Ollama, num_gpu=0 forces CPU
            opts["num_gpu"] = 0
        elif self.num_gpu_layers is not None:
            # Limit GPU usage (number of layers)
            opts["num_gpu"] = int(self.num_gpu_layers)
        if self.temperature is not None:
            opts["temperature"] = float(self.temperature)
        opts.update(self.extra_options)
        return opts

    def invoke(self, prompt: str) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": self._options(),
        }
        try:
            r = requests.post(url, json=payload, timeout=120)
            r.raise_for_status()
            data = r.json()
            # The unified response contains 'response'
            return data.get("response", "")
        except requests.HTTPError as e:
            # Surface helpful server error details
            detail = e.response.text if e.response is not None else str(e)
            raise RuntimeError(f"Ollama call failed: {detail}") from e
        except Exception as e:
            raise RuntimeError(f"Ollama call failed: {str(e)}") from e
