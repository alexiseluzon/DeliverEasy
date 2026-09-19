import os
import sys

# Must run before app.core.config is imported anywhere, so tests never
# touch production credentials in .env.
os.environ.setdefault("ENV_FILE", ".env.test")

# asyncpg is incompatible with Windows' default ProactorEventLoop policy
# (causes "Event loop is closed" / orphaned-task errors under pytest-asyncio).
# Selector policy is what asyncpg expects; harmless on non-Windows.
if sys.platform == "win32":
    import asyncio

    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.core.database import AsyncSessionLocal, engine
from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Truncate after each test so runs stay repeatable (no duplicate-email
    # collisions on rerun). Safe here because this always targets the
    # dedicated test database (.env.test), never production.
    async with AsyncSessionLocal() as session:
        await session.execute(
            text("TRUNCATE TABLE order_items, orders, products, users RESTART IDENTITY CASCADE")
        )
        await session.commit()

    # Dispose the pool's connections after every test instead of leaving them
    # idle. Under Windows + asyncpg, idle pooled connections held across
    # pytest-asyncio's per-test teardown are what surface as orphaned
    # "Task pending" / "Event loop is closed" errors later in the session.
    await engine.dispose()