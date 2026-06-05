import json
import os
from typing import Dict, Any

POLICY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../policy_terms.json"))

def load_policy() -> Dict[str, Any]:
    with open(POLICY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

POLICY = load_policy()

def reload_policy() -> None:
    global POLICY
    new_policy = load_policy()
    # Update dict in place to ensure references across the app are updated
    POLICY.clear()
    POLICY.update(new_policy)
