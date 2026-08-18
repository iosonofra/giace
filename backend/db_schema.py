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

COMPATIBILITY_INDEXES = (
    (
        "prestashop_orders",
        "ix_prestashop_orders_state_date",
        {"current_state", "date_add", "order_id"},
        "CREATE INDEX ix_prestashop_orders_state_date "
        "ON prestashop_orders (current_state, date_add, order_id)",
    ),
    (
        "prestashop_order_lines",
        "ix_prestashop_order_lines_order_id",
        {"order_id"},
        "CREATE INDEX ix_prestashop_order_lines_order_id "
        "ON prestashop_order_lines (order_id)",
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

    schema = inspect(db_engine)
    for (
        table_name,
        index_name,
        required_columns,
        statement,
    ) in COMPATIBILITY_INDEXES:
        if table_name not in existing_tables:
            continue
        existing_columns = {
            column["name"]
            for column in schema.get_columns(table_name)
        }
        if not required_columns.issubset(existing_columns):
            continue
        existing_indexes = {
            index["name"]
            for index in schema.get_indexes(table_name)
        }
        if index_name in existing_indexes:
            continue
        with db_engine.begin() as connection:
            connection.execute(text(statement))


def initialize_database(db_engine=engine, metadata=Base.metadata) -> None:
    """Create the current schema and keep older local databases compatible."""
    metadata.create_all(bind=db_engine)
    apply_compatibility_migrations(db_engine)
