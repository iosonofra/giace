import json
import re
from dataclasses import dataclass

from backend.models import AppSetting


DEFAULT_EXCLUDED_LOT_KEYWORDS = ("RESO", "RESI")
POLICY_SETTING_KEYS = (
    "exclude_return_lots",
    "excluded_lot_keywords",
)


@dataclass(frozen=True)
class StockCalculationPolicy:
    exclude_return_lots: bool = False
    excluded_lot_keywords: tuple[str, ...] = DEFAULT_EXCLUDED_LOT_KEYWORDS


def normalize_lot_keywords(values) -> tuple[str, ...]:
    normalized = []
    for value in values or []:
        keyword = str(value or "").strip().upper()
        if keyword and keyword not in normalized:
            normalized.append(keyword)
    return tuple(normalized) or DEFAULT_EXCLUDED_LOT_KEYWORDS


def load_stock_calculation_policy(db) -> StockCalculationPolicy:
    settings = {
        setting.key: setting.value
        for setting in db.query(AppSetting)
        .filter(AppSetting.key.in_(POLICY_SETTING_KEYS))
        .all()
    }
    try:
        keywords = json.loads(
            settings.get(
                "excluded_lot_keywords",
                json.dumps(DEFAULT_EXCLUDED_LOT_KEYWORDS),
            )
        )
    except (TypeError, ValueError):
        keywords = DEFAULT_EXCLUDED_LOT_KEYWORDS

    return StockCalculationPolicy(
        exclude_return_lots=(
            settings.get("exclude_return_lots", "false").lower()
            in {"true", "1", "yes"}
        ),
        excluded_lot_keywords=normalize_lot_keywords(keywords),
    )


def excluded_lot_keyword(
    lotto,
    policy: StockCalculationPolicy,
) -> str | None:
    if not policy.exclude_return_lots:
        return None
    value = str(lotto or "").strip().upper()
    if not value:
        return None
    for keyword in policy.excluded_lot_keywords:
        if re.search(
            rf"(?<!\w){re.escape(keyword)}(?!\w)",
            value,
        ):
            return keyword
    return None


def is_stock_row_calculable(
    item,
    policy: StockCalculationPolicy,
) -> bool:
    return excluded_lot_keyword(
        getattr(item, "lotto", ""),
        policy,
    ) is None
