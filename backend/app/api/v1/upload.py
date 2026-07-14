from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.auth.dependencies import get_current_active_user
from app.utils.s3 import upload_file_to_s3
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("")
def upload_file(file: UploadFile = File(...), folder: str = Query("attachments"),
                u: User = Depends(get_current_active_user)):
    url = upload_file_to_s3(file, folder=folder)
    return {"url": url, "filename": file.filename}
