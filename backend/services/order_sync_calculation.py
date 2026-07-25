import logging
from collections.abc import Callable

from backend.calculator import run_calculation


logger = logging.getLogger(__name__)


def run_order_calculation(
    db,
    context: str,
    calculator: Callable = run_calculation,
) -> bool:
    try:
        calculator(db)
        return True
    except Exception as error:
        logger.error(
            "Errore nel calcolo automatico %s: %s",
            context,
            error,
        )
        return False
