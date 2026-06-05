import json
from fastapi import APIRouter, HTTPException, Body
from app.core.policy import POLICY_PATH, reload_policy, POLICY

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/policy")
def get_policy():
    return POLICY

@router.put("/policy")
def update_policy(payload: dict = Body(...)):
    try:
        with open(POLICY_PATH, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        
        # Reload into memory
        reload_policy()
        return {"success": True, "message": "Policy updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save policy: {str(e)}")
