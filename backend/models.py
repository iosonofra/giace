from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, UniqueConstraint, Text
from sqlalchemy.sql import func
from backend.database import Base

class ImportBatch(Base):
    __tablename__ = "import_batches"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    file_type = Column(String(50), nullable=False) # 'warehouse' or 'associations'
    filename = Column(String(255), nullable=False)
    sheet_name = Column(String(100), nullable=True)
    imported_at = Column(DateTime, default=func.now())
    record_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True) # Only one batch can be active per file_type

class WarehouseStock(Base):
    __tablename__ = "warehouse_stock"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    import_batch_id = Column(Integer, ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    lotto = Column(String(100), nullable=True)
    qty_total = Column(Float, default=0.0)
    imported_at = Column(DateTime, default=func.now())

class ProductComponent(Base):
    __tablename__ = "product_components"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    import_batch_id = Column(Integer, ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, nullable=False)
    sku = Column(String(100), nullable=False)
    qty_required = Column(Integer, default=1)
    imported_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint('import_batch_id', 'product_id', 'sku', name='uix_batch_prod_sku'),
    )

class PrestashopOrder(Base):
    __tablename__ = "prestashop_orders"
    
    order_id = Column(Integer, primary_key=True)
    current_state = Column(Integer, nullable=False)
    current_state_label = Column(String(100), nullable=True)
    date_add = Column(DateTime, nullable=True)
    date_upd = Column(DateTime, nullable=True)
    customer_name = Column(String(200), nullable=True)
    total_paid = Column(Float, nullable=True)
    synced_at = Column(DateTime, default=func.now())


class PrestashopOrderLine(Base):
    __tablename__ = "prestashop_order_lines"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("prestashop_orders.order_id", ondelete="CASCADE"), nullable=False)
    line_id = Column(Integer, nullable=True)
    product_id = Column(Integer, nullable=False)
    product_attribute_id = Column(Integer, nullable=True)
    product_reference = Column(String(100), nullable=True)
    product_name = Column(String(255), nullable=True)
    product_quantity = Column(Integer, default=1)

class CalcRun(Base):
    __tablename__ = "calc_runs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    warehouse_batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=True)
    associations_batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=True)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="running") # 'running', 'completed', 'failed'

class SkuCommitment(Base):
    __tablename__ = "sku_commitments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    calc_run_id = Column(Integer, ForeignKey("calc_runs.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100), nullable=False)
    qty_committed = Column(Float, default=0.0)
    qty_total = Column(Float, default=0.0)
    qty_residual = Column(Float, default=0.0)

    __table_args__ = (
        UniqueConstraint('calc_run_id', 'sku', name='uix_run_sku'),
    )

class ProductAvailability(Base):
    __tablename__ = "product_availability"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    calc_run_id = Column(Integer, ForeignKey("calc_runs.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, nullable=False)
    qty_available = Column(Integer, default=0)
    limiting_sku = Column(String(100), nullable=True)

    __table_args__ = (
        UniqueConstraint('calc_run_id', 'product_id', name='uix_run_product'),
    )

class ImportAnomaly(Base):
    __tablename__ = "import_anomalies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(100), nullable=False) # 'stock_import', 'associations_import', 'orders_sync', 'calculation'
    record_key = Column(String(100), nullable=True) # SKU or product_id or order_id
    order_id = Column(Integer, nullable=True)
    anomaly_type = Column(String(100), nullable=False) # 'missing_sku', 'missing_association', 'invalid_quantity', etc.
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

class AppSetting(Base):
    __tablename__ = "app_settings"
    
    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False) # JSON encoded list or string value
