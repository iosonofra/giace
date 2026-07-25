import logging
import time
from collections.abc import Callable

import requests


logger = logging.getLogger(__name__)


class PrestaShopTransport:
    def __init__(
        self,
        *,
        request_get: Callable = requests.get,
        sleeper: Callable[[float], None] = time.sleep,
        max_retries: int = 3,
        initial_backoff: float = 1.0,
    ):
        self._request_get = request_get
        self._sleeper = sleeper
        self._max_retries = max(1, max_retries)
        self._initial_backoff = max(0, initial_backoff)

    def get(
        self,
        url: str,
        *,
        params: dict,
        timeout: int = 30,
    ) -> requests.Response:
        backoff = self._initial_backoff

        for attempt in range(self._max_retries):
            try:
                return self._request_get(
                    url,
                    params=params,
                    timeout=timeout,
                )
            except (
                requests.exceptions.Timeout,
                requests.exceptions.ConnectionError,
            ) as error:
                if attempt == self._max_retries - 1:
                    logger.error(
                        "Errore di rete definitivo per %s dopo %s "
                        "tentativi: %s",
                        url,
                        self._max_retries,
                        error,
                    )
                    raise

                logger.warning(
                    "Tentativo %s fallito per %s (%s). "
                    "Riprovo tra %ss...",
                    attempt + 1,
                    url,
                    error,
                    backoff,
                )
                self._sleeper(backoff)
                backoff *= 2

        raise RuntimeError("Ciclo retry terminato senza risposta.")
