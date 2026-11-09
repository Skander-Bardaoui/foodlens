import os
from collections.abc import Iterator

import pytest
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Base


def _test_database_url() -> str:
    explicit = os.getenv("TEST_DATABASE_URL")
    if explicit:
        return explicit

    url = make_url(settings.database_url)
    if not url.database:
        raise RuntimeError("DATABASE_URL must include a database name to derive the test database")
    return url.set(database=f"{url.database}_test").render_as_string(hide_password=False)


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    url = make_url(_test_database_url())

    admin_engine = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as connection:
        exists = connection.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": url.database},
        ).scalar()
        if not exists:
            database = url.database.replace('"', '""')
            connection.execute(text(f'CREATE DATABASE "{database}"'))
    admin_engine.dispose()

    test_engine = create_engine(url)
    Base.metadata.drop_all(test_engine)
    Base.metadata.create_all(test_engine)

    yield test_engine

    Base.metadata.drop_all(test_engine)
    test_engine.dispose()


@pytest.fixture()
def db(engine: Engine) -> Iterator[Session]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
