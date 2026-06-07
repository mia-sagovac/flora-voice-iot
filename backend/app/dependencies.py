from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from app.thingsboard import tb_client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # ovo u zagradi je za swagger


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Provjeri da je token valjan i vrati user info iz ThingsBoarda (Depends u bilo koji endpoint koji treba autentikaciju).
    """
    return await tb_client.get_user(token)
