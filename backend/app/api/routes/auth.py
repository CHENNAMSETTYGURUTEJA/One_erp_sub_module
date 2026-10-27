from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...core.security import verify_password, hash_password, create_access_token
from ...models.user import User
from ...schemas.auth import UserLogin, UserRegister, TokenResponse, UserProfileUpdate
from ...api.dependencies import get_current_user
from ...utils.response import success_response, error_response

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])


@router.post(
    "/login",
    summary="User Login",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": UserLogin.model_json_schema()
                },
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "username": {"type": "string", "example": "admin"},
                            "password": {"type": "string"},
                        },
                        "required": ["username", "password"],
                    }
                },
            }
        }
    },
)
async def login(request: Request, db: Session = Depends(get_db)):
    """
    Authenticates a user and returns an access token.
    Supports both JSON payload (application/json) for React Frontend and
    Form Data (application/x-www-form-urlencoded) for Swagger UI OAuth2 Authorize flow.
    """
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            if isinstance(body, dict):
                username = body.get("username")
                password = body.get("password")
        except Exception:
            pass

    if not username or not password:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Both username and password are required.",
                "detail": "Both username and password are required.",
                "data": None,
            },
        )

    user = db.query(User).filter(User.username == str(username).strip()).first()
    if not user or not verify_password(str(password), user.password_hash):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "message": "Invalid username or password",
                "detail": "Invalid username or password",
                "data": None,
            },
        )

    if not user.is_active:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "success": False,
                "message": "User account is deactivated",
                "detail": "User account is deactivated",
                "data": None,
            },
        )

    token = create_access_token({"sub": str(user.user_id), "role": user.role, "username": user.username})



    return {
        "success": True,
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        },
    }


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register User")
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        return error_response(message="Username or email already exists", status_code=status.HTTP_409_CONFLICT)

    new_user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role or "ACCOUNTANT",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return success_response(
        message="User registered successfully",
        data=new_user.to_dict(),
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/me", summary="Get Current User Profile")
def get_me(current_user: User = Depends(get_current_user)):
    if not current_user:
        return error_response(message="Not authenticated", status_code=status.HTTP_401_UNAUTHORIZED)
    return success_response(message="User profile retrieved", data=current_user.to_dict())


@router.put("/profile", summary="Update Current User Profile")
@router.put("/me", summary="Update Current User Profile (Alias)")
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user:
        return error_response(message="Not authenticated", status_code=status.HTTP_401_UNAUTHORIZED)

    if payload.username and payload.username.strip() and payload.username.strip() != current_user.username:
        new_username = payload.username.strip()
        existing = db.query(User).filter(User.username == new_username, User.user_id != current_user.user_id).first()
        if existing:
            return error_response(message="Username is already taken by another account", status_code=status.HTTP_409_CONFLICT)
        current_user.username = new_username

    if payload.email and payload.email.strip() and payload.email.strip() != current_user.email:
        new_email = payload.email.strip()
        existing = db.query(User).filter(User.email == new_email, User.user_id != current_user.user_id).first()
        if existing:
            return error_response(message="Email address is already in use by another account", status_code=status.HTTP_409_CONFLICT)
        current_user.email = new_email

    if payload.new_password:
        if not payload.current_password or not verify_password(payload.current_password, current_user.password_hash):
            return error_response(
                message="Current password is incorrect. Required to set a new password.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        current_user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(current_user)
    return success_response(
        message="Profile updated successfully",
        data=current_user.to_dict()
    )
