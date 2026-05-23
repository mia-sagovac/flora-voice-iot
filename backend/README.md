# FastAPI + ThingsBoard

Mali FastAPI servis koji delegira autentikaciju ThingsBoardu.

## Struktura

```
projekt/
├── .env                  # konfiguracija
├── .gitignore
├── requirements.txt
├── README.md
└── app/
    ├── main.py           # FastAPI app, include_router
    ├── config.py         # Settings iz .env
    ├── schemas.py        # Pydantic modeli
    ├── thingsboard.py    # klijent za ThingsBoard API
    ├── dependencies.py   # reusable Depends (get_current_user)
    └── routers/
        ├── auth.py       # /login
        └── test.py       # /test
```

## Setup

```bash
python3 -m venv .venv
.venv\Scripts\activate.bat # windows
source .venv/bin/activate
pip install -r requirements.txt
```

## Pokretanje

```bash
fastapi dev app/main.py
```

Otvoriti http://127.0.0.1:8000/docs

## Konfiguracija

Promijeni `.env`:

```
THINGSBOARD_URL=https://eu.thingsboard.cloud
```

Pomocu env postaviti na server iz maila.

## Endpointi

- `POST /login` — uzmi JWT s ThingsBoard credentialsima
- `GET /test` — zasticeni endpoint, trazi valjan token
- `GET /`

## Dodavanje novog endpointa

1. Napravi `app/routers/example.py` (npr.)
2. Definiraj `router = APIRouter(...)` i endpointe u njemu
3. U `app/main.py` dodaj `app.include_router(example.router)`

Ako endpoint treba autentikaciju, dodaj `user: dict = Depends(get_current_user)`.
