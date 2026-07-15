from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import LoginRequest, Token, RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest, RegisterRequest
from app.schemas.common import MessageResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.auth.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Public self-registration. Creates an account with the default 'employee' role.
    Returns tokens so the user is logged in immediately after registering.
    """
    return AuthService(db).register(data)


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent", "")
    return AuthService(db).login(credentials, ip=ip, ua=ua)


@router.post("/refresh", response_model=Token)
def refresh(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh_tokens(body.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(request: Request, user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    AuthService(db).logout(user, ip=ip)
    return MessageResponse(message="Logged out successfully")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, bg: BackgroundTasks, db: Session = Depends(get_db)):
    token = AuthService(db).forgot_password(body.email)
    if token:
        bg.add_task(EmailService().send_password_reset_email, body.email, token)
    return MessageResponse(message="If that email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    AuthService(db).reset_password(body.token, body.new_password)
    return MessageResponse(message="Password reset successfully")


@router.post("/change-password", response_model=MessageResponse)
def change_password(body: ChangePasswordRequest, user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    AuthService(db).change_password(user, body.current_password, body.new_password)
    return MessageResponse(message="Password changed successfully")


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_active_user)):
    return user
