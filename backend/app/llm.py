import os
from app.ollama_client import SimpleOllamaLLM

MODEL = os.getenv("OLLAMA_MODEL", "mistral")
BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

def _truthy(val: str | None) -> bool:
    return str(val).lower() in {"1", "true", "yes", "on"}

# Simple singleton-ish LLM
_llm: SimpleOllamaLLM | None = None

def get_llm() -> SimpleOllamaLLM:
    global _llm
    if _llm is None:
        force_cpu = _truthy(os.getenv("OLLAMA_FORCE_CPU"))
        gpu_layers_env = os.getenv("OLLAMA_NUM_GPU_LAYERS")
        gpu_layers = int(gpu_layers_env) if gpu_layers_env and gpu_layers_env.isdigit() else None
        temp_env = os.getenv("OLLAMA_TEMPERATURE")
        temperature = float(temp_env) if temp_env else None

        _llm = SimpleOllamaLLM(
            model=MODEL,
            base_url=BASE_URL,
            force_cpu=force_cpu,
            num_gpu_layers=gpu_layers,
            temperature=temperature,
        )
    return _llm
