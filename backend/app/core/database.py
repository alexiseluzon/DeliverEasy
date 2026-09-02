from collections.abc import AsyncGenerator
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,   # avoids stale-connection failures (fault tolerance)
    pool_size=5,
    max_overflow=10,
    echo=settings.env == "development",
    connect_args={
        "statement_cache_size": 0,
        # Supabase's pgbouncer (transaction mode) routes each query to a
        # different backend connection, so asyncpg's default incrementing
        # statement names collide across sessions. Randomize instead.
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise