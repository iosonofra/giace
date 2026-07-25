from sqlalchemy import inspect, text

from backend.database import Base, engine


COMPATIBILITY_COLUMNS = (
    (
        "prestashop_order_lines",
        "product_name",
        "ALTER TABLE prestashop_order_lines ADD COLUMN product_name VARCHAR(255)",
    ),
    (
        "import_anomalies",
        "order_id",
        "ALTER TABLE import_anomalies ADD COLUMN order_id INTEGER",
    ),
)


def apply_compatibility_migrations(db_engine) -> None:
    """Add columns required by releases that predate a migration system."""
    schema = inspect(db_engine)
    existing_tables = set(schema.get_table_names())

    for table_name, column_name, statement in COMPATIBILITY_COLUMNS:
        if table_name not in existing_tables:
            continue

        existing_columns = {
            column["name"]
            for column in schema.get_columns(table_name)
        }
        if column_name in existing_columns:
            continue

        with db_engine.begin() as connection:
            connection.execute(text(statement))


def initialize_database(db_engine=engine, metadata=Base.metadata) -> None:
    """Create the current schema and keep older local databases compatible."""
    metadata.create_all(bind=db_engine)
    apply_compatibility_migrations(db_engine)
