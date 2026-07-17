(() => {
  const BADGE_ATTRIBUTE = "data-giac-feedback";
  const ROW_ATTRIBUTE = "data-giac-order-id";
  const POPOVER_ID = "giac-feedback-popover";
  const TOOLBAR_ID = "giac-feedback-toolbar";
  const STALE_AFTER_MS = 30 * 60 * 1000;
  const badgeData = new WeakMap();
  let observer = null;
  let debounceTimer = null;
  let openTimer = null;
  let closeTimer = null;
  let lastSignature = "";
  let configuredOrigin = "";
  let configuredWebappUrl = "";
  let extensionEnabled = false;
  let activeBadge = null;
  let popoverPinned = false;
  let activeOrderFilter = "all";
  let chronologicalMode = true;
  let latestListEntries = [];
  let latestListFreshness = {};

  function sendMessage(message) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: false, error: "Nessuna risposta dall'estensione." });
      });
    });
  }

  function looksLikeOrdersPage() {
    const url = window.location.href.toLowerCase();
    const heading = Array.from(document.querySelectorAll("h1, h2, .page-title"))
      .map(element => element.textContent || "")
      .join(" ")
      .toLowerCase();
    return (
      url.includes("adminorders")
      || url.includes("controller=orders")
      || url.includes("/sell/orders")
      || heading.includes("ordini++")
      || heading.trim() === "ordini"
    );
  }

  function originAllowed() {
    if (!configuredOrigin) return true;
    try {
      return window.location.origin === new URL(configuredOrigin).origin;
    } catch {
      return false;
    }
  }

  function getSafeWebappUrl() {
    try {
      const url = new URL(configuredWebappUrl);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      return url.toString();
    } catch {
      return "";
    }
  }

  function extractOrderId(row) {
    const datasetCandidates = [
      row.dataset.orderId,
      row.dataset.idOrder,
      row.getAttribute("data-id-order"),
      row.getAttribute("data-order-id")
    ];
    for (const value of datasetCandidates) {
      if (/^\d{4,10}$/.test(String(value || "").trim())) return Number(value);
    }

    const checkboxCandidates = row.querySelectorAll(
      'input[type="checkbox"][value], input[name*="orderBox"], input[name*="orders"]'
    );
    for (const input of checkboxCandidates) {
      const value = String(input.value || "").trim();
      if (/^\d{4,10}$/.test(value)) return Number(value);
    }

    const cells = Array.from(row.querySelectorAll(":scope > th, :scope > td")).slice(0, 4);
    for (const cell of cells) {
      const directText = Array.from(cell.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent)
        .join(" ")
        .trim();
      const directMatch = directText.match(/(?:^|\s)(\d{4,10})(?:\s|$)/);
      if (directMatch) return Number(directMatch[1]);

      const fullMatch = String(cell.textContent || "").trim().match(/^(\d{4,10})$/);
      if (fullMatch) return Number(fullMatch[1]);
    }
    return null;
  }

  function extractDetailOrderId() {
    let url;
    try {
      url = new URL(window.location.href);
    } catch {
      return null;
    }

    for (const key of ["id_order", "idOrder", "order_id", "orderId"]) {
      const value = String(url.searchParams.get(key) || "").trim();
      if (/^\d{4,10}$/.test(value)) return Number(value);
    }

    for (const pattern of [
      /\/sell\/orders\/(\d{4,10})(?:\/|$)/i,
      /\/orders\/(\d{4,10})(?:\/|$)/i
    ]) {
      const match = url.pathname.match(pattern);
      if (match) return Number(match[1]);
    }

    for (const heading of document.querySelectorAll("h1, h2, .page-title")) {
      const match = String(heading.textContent || "")
        .replace(/\s+/g, " ")
        .match(/\b(?:ordine|order)\s*#?\s*(\d{4,10})\b/i);
      if (match) return Number(match[1]);
    }
    return null;
  }

  function collectDetailOrderEntry() {
    const orderId = extractDetailOrderId();
    if (!orderId) return null;

    let slot = document.querySelector('[data-giac-detail-feedback="true"]');
    if (!slot) {
      slot = document.createElement("span");
      slot.className = "giac-detail-feedback-slot";
      slot.setAttribute("data-giac-detail-feedback", "true");
    }

    const titleCandidates = Array.from(document.querySelectorAll(
      "h1, h2, .page-title"
    ));
    const orderTitle = titleCandidates.find(element => {
      const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
      return /^ordine\b/i.test(text) && !/^ordini\b/i.test(text) && text.length > 8;
    });

    if (orderTitle) {
      slot.setAttribute("data-giac-detail-placement", "title-inline");
      if (slot.parentElement !== orderTitle || orderTitle.lastElementChild !== slot) {
        orderTitle.appendChild(slot);
      }
    } else {
      const orderHeaders = Array.from(document.querySelectorAll(
        ".panel-heading, .card-header, .box-header, .order-heading, legend"
      ));
      const orderHeader = orderHeaders.find(element => (
        String(element.textContent || "").includes(String(orderId))
      ));
      const fallback = document.querySelector("main, #content, .content-div");
      if (!orderHeader && !fallback) return null;

      slot.setAttribute("data-giac-detail-placement", "fallback");
      if (orderHeader && orderHeader.nextElementSibling !== slot) {
        orderHeader.insertAdjacentElement("afterend", slot);
      } else if (!orderHeader && slot.parentElement !== fallback) {
        fallback.prepend(slot);
      }
    }

    slot.setAttribute(ROW_ATTRIBUTE, String(orderId));

    return { row: slot, targetCell: slot, orderId, isDetail: true };
  }

  function findOrderIdCell(row, orderId) {
    const cells = Array.from(row.querySelectorAll(":scope > th, :scope > td"));
    return cells.find(cell => {
      const text = String(cell.textContent || "").replace(/\s+/g, " ").trim();
      return text === String(orderId) || text.startsWith(`${orderId} `);
    }) || cells[1] || cells[0] || null;
  }

  function collectOrderRows() {
    const detailEntry = collectDetailOrderEntry();
    if (detailEntry) return [detailEntry];

    const rows = [];
    for (const row of document.querySelectorAll("table tbody tr")) {
      if (row.closest(".autocomplete-dropdown")) continue;
      const orderId = extractOrderId(row);
      if (!orderId) continue;
      const targetCell = findOrderIdCell(row, orderId);
      if (!targetCell) continue;
      row.setAttribute(ROW_ATTRIBUTE, String(orderId));
      rows.push({ row, targetCell, orderId });
    }
    return rows;
  }

  function clearPopoverTimers() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  }

  function schedulePopoverClose() {
    clearTimeout(closeTimer);
    if (popoverPinned) return;
    closeTimer = setTimeout(() => closePopover(), 180);
  }

  function ensureBadge(targetCell) {
    let badge = targetCell.querySelector(`[${BADGE_ATTRIBUTE}]`);
    if (!badge) {
      badge = document.createElement("button");
      badge.type = "button";
      badge.setAttribute(BADGE_ATTRIBUTE, "true");
      badge.setAttribute("aria-haspopup", "dialog");
      badge.setAttribute("aria-controls", POPOVER_ID);
      badge.setAttribute("aria-expanded", "false");
      badge.className = "giac-feedback-badge giac-feedback-loading";
      targetCell.appendChild(badge);

      badge.addEventListener("mouseenter", () => {
        clearPopoverTimers();
        openTimer = setTimeout(() => openPopover(badge, false), 120);
      });
      badge.addEventListener("mouseleave", schedulePopoverClose);
      badge.addEventListener("focus", () => {
        clearPopoverTimers();
        openPopover(badge, false);
      });
      badge.addEventListener("blur", schedulePopoverClose);
      badge.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (activeBadge === badge && popoverPinned) {
          closePopover();
          return;
        }
        openPopover(badge, true);
        if (event.detail === 0) {
          setTimeout(() => {
            document.querySelector(`#${POPOVER_ID} .giac-popover-close`)?.focus();
          }, 0);
        }
      });
      badge.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          event.preventDefault();
          closePopover();
          badge.focus();
        }
      });
    }
    return badge;
  }

  function formatQuantity(value) {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(numeric);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("it-IT");
  }

  function getFreshnessMeta(value) {
    if (!value) return { relative: "Mai", exact: "Dato non disponibile", stale: true };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { relative: "Data non valida", exact: String(value), stale: true };
    }
    const ageMs = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(ageMs / 60000);
    let relative = "Adesso";
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      relative = `${days} ${days === 1 ? "giorno" : "giorni"} fa`;
    } else if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      relative = `${hours} ${hours === 1 ? "ora" : "ore"} fa`;
    } else if (minutes > 0) {
      relative = `${minutes} min fa`;
    }
    return {
      relative,
      exact: formatDateTime(value),
      stale: ageMs > STALE_AFTER_MS
    };
  }

  function isFreshnessStale(freshness) {
    const values = [
      freshness?.warehouse_checked_at || freshness?.warehouse_imported_at,
      freshness?.orders_checked_at || freshness?.orders_synced_at
    ].filter(Boolean);
    if (values.length === 0) return false;
    return values.some(value => getFreshnessMeta(value).stale);
  }

  function orderMatchesFilter(status, filter) {
    if (filter === "all") return true;
    if (filter === "preparable") return status === "preparable";
    if (filter === "not_found") return status === "not_found";
    if (filter === "attention") {
      return ["blocked", "protected", "pending", "error"].includes(status);
    }
    return true;
  }

  function applyOrderFilter(entries) {
    for (const entry of entries) {
      if (entry.isDetail) continue;
      const status = entry.row.dataset.giacFeedbackStatus || "loading";
      entry.row.classList.toggle(
        "giac-order-filter-hidden",
        !orderMatchesFilter(status, activeOrderFilter)
      );
    }
  }

  function renderOrdersToolbar(entries, freshness = {}) {
    if (entries.length === 0 || entries.some(entry => entry.isDetail)) {
      document.getElementById(TOOLBAR_ID)?.remove();
      return;
    }
    const table = entries[0].row.closest("table");
    if (!table) return;
    latestListEntries = entries;
    latestListFreshness = freshness;

    let toolbar = document.getElementById(TOOLBAR_ID);
    if (!toolbar) {
      toolbar = document.createElement("section");
      toolbar.id = TOOLBAR_ID;
      toolbar.className = "giac-feedback-toolbar";
      toolbar.setAttribute("aria-label", "Riepilogo disponibilità ordini");

      const label = appendTextElement(toolbar, "strong", "giac-toolbar-label", "Disponibilità");
      label.setAttribute("aria-hidden", "true");
      const filters = document.createElement("div");
      filters.className = "giac-toolbar-filters";
      for (const filter of ["all", "preparable", "attention", "not_found"]) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.giacFilter = filter;
        button.addEventListener("click", () => {
          activeOrderFilter = filter;
          renderOrdersToolbar(latestListEntries, latestListFreshness);
        });
        filters.appendChild(button);
      }
      toolbar.appendChild(filters);

      const modeControl = document.createElement("label");
      modeControl.className = "giac-toolbar-mode";
      modeControl.title = "Cambia tra disponibilità corrente e valutazione cronologica";
      const modeInput = document.createElement("input");
      modeInput.type = "checkbox";
      modeInput.setAttribute("role", "switch");
      modeInput.setAttribute("aria-label", "Valutazione cronologica degli ordini");
      const modeTrack = document.createElement("span");
      modeTrack.className = "giac-toolbar-mode-track";
      modeTrack.setAttribute("aria-hidden", "true");
      const modeText = appendTextElement(modeControl, "span", "giac-toolbar-mode-text", "");
      modeControl.prepend(modeInput, modeTrack);
      modeInput.addEventListener("change", async () => {
        const nextValue = modeInput.checked;
        modeInput.disabled = true;
        const response = await sendMessage({
          type: "UPDATE_EVALUATION_MODE",
          chronologicalMode: nextValue
        });
        modeInput.disabled = false;
        if (!response?.ok) {
          modeInput.checked = chronologicalMode;
          return;
        }
        chronologicalMode = response.chronologicalMode !== false;
        modeText.textContent = chronologicalMode ? "Cronologico" : "Disponibilità";
        lastSignature = "";
        scheduleRefresh(true);
      });
      const toolbarActions = document.createElement("div");
      toolbarActions.className = "giac-toolbar-actions";
      appendTextElement(toolbarActions, "span", "giac-toolbar-freshness", "");
      toolbarActions.appendChild(modeControl);
      toolbar.appendChild(toolbarActions);
      table.insertAdjacentElement("beforebegin", toolbar);
    } else if (toolbar.nextElementSibling !== table) {
      table.insertAdjacentElement("beforebegin", toolbar);
    }

    const counts = { all: entries.length, preparable: 0, attention: 0, not_found: 0 };
    for (const entry of entries) {
      const status = entry.row.dataset.giacFeedbackStatus || "loading";
      if (status === "preparable") counts.preparable += 1;
      if (["blocked", "protected", "pending", "error"].includes(status)) counts.attention += 1;
      if (status === "not_found") counts.not_found += 1;
    }
    const labels = {
      all: `Tutti ${counts.all}`,
      preparable: `Gestibili ${counts.preparable}`,
      attention: `Da verificare ${counts.attention}`,
      not_found: `Non sincronizzati ${counts.not_found}`
    };
    for (const button of toolbar.querySelectorAll("[data-giac-filter]")) {
      const filter = button.dataset.giacFilter;
      button.textContent = labels[filter];
      button.classList.toggle("active", filter === activeOrderFilter);
      button.setAttribute("aria-pressed", String(filter === activeOrderFilter));
    }
    const modeInput = toolbar.querySelector(".giac-toolbar-mode input");
    const modeText = toolbar.querySelector(".giac-toolbar-mode-text");
    modeInput.checked = chronologicalMode;
    modeText.textContent = chronologicalMode ? "Cronologico" : "Disponibilità";

    const freshnessElement = toolbar.querySelector(".giac-toolbar-freshness");
    const checkedAt = freshness?.orders_checked_at || freshness?.orders_synced_at;
    const freshnessMeta = getFreshnessMeta(checkedAt);
    freshnessElement.textContent = checkedAt ? `Ordini verificati ${freshnessMeta.relative}` : "Verifica in corso";
    freshnessElement.classList.toggle("stale", isFreshnessStale(freshness));
    applyOrderFilter(entries);
  }

  function getStatusMeta(status) {
    const statuses = {
      preparable: { label: "Gestibile", eyebrow: "Ordine preparabile", symbol: "✓" },
      protected: { label: "Scorta protetta", eyebrow: "Verifica richiesta", symbol: "!" },
      blocked: { label: "Non gestibile", eyebrow: "Prelievo bloccato", symbol: "×" },
      pending: { label: "Non valutato", eyebrow: "In attesa", symbol: "…" },
      not_in_scope: { label: "Fuori dagli stati", eyebrow: "Ordine escluso", symbol: "–" },
      not_found: { label: "Non sincronizzato", eyebrow: "Dato mancante", symbol: "?" },
      loading: { label: "Verifica in corso", eyebrow: "Calcolo disponibilità", symbol: "…" },
      error: { label: "Giac offline", eyebrow: "Connessione non riuscita", symbol: "!" }
    };
    return statuses[status] || statuses.error;
  }

  function appendTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderBadge(badge, order) {
    const status = order?.status || "error";
    const meta = getStatusMeta(status);
    badge.className = `giac-feedback-badge giac-feedback-${status}`;
    badge.replaceChildren();
    appendTextElement(badge, "span", "giac-feedback-badge-symbol", meta.symbol);
    appendTextElement(badge, "span", "giac-feedback-badge-label", order?.label || meta.label);
    badge.setAttribute(
      "aria-label",
      `${order?.label || meta.label}. Apri il dettaglio disponibilità.`
    );
  }

  function createPopover() {
    let popover = document.getElementById(POPOVER_ID);
    if (popover) return popover;

    popover = document.createElement("section");
    popover.id = POPOVER_ID;
    popover.className = "giac-feedback-popover";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-modal", "false");
    popover.setAttribute("aria-label", "Dettaglio disponibilità ordine");
    popover.hidden = true;
    document.body.appendChild(popover);

    popover.addEventListener("mouseenter", clearPopoverTimers);
    popover.addEventListener("mouseleave", schedulePopoverClose);
    popover.addEventListener("click", event => event.stopPropagation());
    popover.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        const badge = activeBadge;
        closePopover();
        badge?.focus();
      }
    });
    return popover;
  }

  function createMetric(label, value, tone = "") {
    const metric = document.createElement("div");
    metric.className = `giac-popover-metric ${tone}`.trim();
    appendTextElement(metric, "span", "", label);
    appendTextElement(metric, "strong", "", formatQuantity(value));
    return metric;
  }

  function createSkuCard(item, status) {
    const card = document.createElement("article");
    const isProtected = item.violation_type === "protected_residual";
    card.className = `giac-popover-sku ${isProtected ? "protected" : status === "preparable" ? "success" : "danger"}`;

    const heading = document.createElement("div");
    heading.className = "giac-popover-sku-heading";
    const headingText = document.createElement("div");
    appendTextElement(headingText, "strong", "", item.sku || "SKU non disponibile");
    if (item.description) appendTextElement(headingText, "small", "", item.description);
    heading.appendChild(headingText);

    if (status !== "preparable") {
      appendTextElement(
        heading,
        "span",
        "giac-popover-shortage",
        isProtected ? "Sotto minimo" : `Mancano ${formatQuantity(item.qty_missing)}`
      );
    }
    card.appendChild(heading);

    const metrics = document.createElement("div");
    metrics.className = "giac-popover-metrics";
    if (status === "preparable") {
      metrics.append(
        createMetric("Richiesti", item.qty_required),
        createMetric("Prima", item.avail_before),
        createMetric("Dopo", item.avail_after, Number(item.avail_after) <= 0 ? "warning" : "success")
      );
    } else {
      metrics.append(
        createMetric("Richiesti", item.qty_required),
        createMetric("Disponibili", item.qty_available),
        createMetric(
          isProtected ? "Residuo" : "Mancano",
          isProtected ? item.qty_available_after : item.qty_missing,
          isProtected ? "warning" : "danger"
        )
      );
    }
    card.appendChild(metrics);

    if (isProtected) {
      appendTextElement(
        card,
        "p",
        "giac-popover-item-note",
        `Scorta minima impostata: ${formatQuantity(item.min_residual)} unità.`
      );
    }
    return card;
  }

  function createFreshnessRow(label, value, warnWhenStale = true) {
    const meta = getFreshnessMeta(value);
    const row = document.createElement("div");
    row.className = `giac-popover-freshness-row ${warnWhenStale && meta.stale ? "stale" : ""}`.trim();
    appendTextElement(row, "span", "", label);
    const time = appendTextElement(row, "time", "", meta.relative);
    time.title = meta.exact;
    if (value) time.dateTime = value;
    return row;
  }

  function renderPopoverContent(popover, order, freshness) {
    const status = order?.status || "error";
    const meta = getStatusMeta(status);
    popover.className = `giac-feedback-popover giac-popover-${status}`;
    popover.replaceChildren();

    const header = document.createElement("header");
    header.className = "giac-popover-header";
    const statusIcon = appendTextElement(header, "span", "giac-popover-status-icon", meta.symbol);
    statusIcon.setAttribute("aria-hidden", "true");
    const titleBlock = document.createElement("div");
    titleBlock.className = "giac-popover-title";
    appendTextElement(titleBlock, "span", "giac-popover-eyebrow", meta.eyebrow);
    appendTextElement(titleBlock, "strong", "", order?.label || meta.label);
    header.appendChild(titleBlock);
    if (order?.orderId) {
      appendTextElement(header, "span", "giac-popover-order-id", `#${order.orderId}`);
    }
    const closeButton = appendTextElement(header, "button", "giac-popover-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Chiudi dettaglio");
    closeButton.addEventListener("click", closePopover);
    popover.appendChild(header);

    const body = document.createElement("div");
    body.className = "giac-popover-body";

    if (order?.queue_position) {
      const queue = document.createElement("div");
      queue.className = "giac-popover-queue";
      appendTextElement(queue, "span", "", "Posizione nella coda cronologica");
      appendTextElement(queue, "strong", "", `${order.queue_position}ª`);
      body.appendChild(queue);
    }

    const reason = order?.reason || (
      status === "preparable"
        ? "Disponibilità confermata"
        : status === "error"
          ? "Webapp non raggiungibile"
          : meta.label
    );
    const detail = order?.reason_detail || (
      status === "preparable"
        ? order?.evaluation_mode === "availability"
          ? "Le SKU richieste sono disponibili rispetto alla giacenza corrente, senza consumi simulati degli altri ordini."
          : "Le SKU richieste sono disponibili rispettando la sequenza cronologica."
        : order?.message || ""
    );
    const reasonBox = document.createElement("div");
    reasonBox.className = "giac-popover-reason";
    appendTextElement(reasonBox, "strong", "", reason);
    if (detail) appendTextElement(reasonBox, "p", "", detail);
    body.appendChild(reasonBox);

    const items = status === "preparable"
      ? (order?.items || [])
      : (order?.limiting_skus || []);
    if (items.length > 0) {
      const skuSection = document.createElement("div");
      skuSection.className = "giac-popover-sku-list";
      appendTextElement(
        skuSection,
        "span",
        "giac-popover-section-label",
        status === "preparable" ? "Impatto sulle giacenze" : "SKU che bloccano l’ordine"
      );
      for (const item of items) {
        skuSection.appendChild(createSkuCard(item, status));
      }
      body.appendChild(skuSection);
    }

    const missingReferences = order?.missing_references || [];
    if (missingReferences.length > 0) {
      const missingBox = document.createElement("div");
      missingBox.className = "giac-popover-missing-references";
      appendTextElement(missingBox, "strong", "", "Riferimenti prodotto mancanti");
      appendTextElement(
        missingBox,
        "span",
        "",
        `${missingReferences.length} ${missingReferences.length === 1 ? "riga ordine richiede" : "righe ordine richiedono"} un’associazione.`
      );
      body.appendChild(missingBox);
    }

    const freshnessBox = document.createElement("div");
    freshnessBox.className = "giac-popover-freshness";
    appendTextElement(freshnessBox, "span", "giac-popover-section-label", "Freschezza dei dati");
    const warehouseCheckedAt = freshness?.warehouse_checked_at || freshness?.warehouse_imported_at;
    const warehouseChangedAt = freshness?.warehouse_changed_at || freshness?.warehouse_imported_at;
    const ordersCheckedAt = freshness?.orders_checked_at || freshness?.orders_synced_at;
    freshnessBox.appendChild(createFreshnessRow("Giacenze verificate", warehouseCheckedAt));
    if (
      warehouseChangedAt
      && warehouseCheckedAt
      && Math.abs(new Date(warehouseCheckedAt).getTime() - new Date(warehouseChangedAt).getTime()) > 1000
    ) {
      freshnessBox.appendChild(createFreshnessRow("Dati modificati", warehouseChangedAt, false));
    }
    freshnessBox.appendChild(createFreshnessRow("Ordini verificati", ordersCheckedAt));
    body.appendChild(freshnessBox);
    popover.appendChild(body);

    const footer = document.createElement("footer");
    footer.className = "giac-popover-footer";
    appendTextElement(
      footer,
      "span",
      "giac-popover-interaction-hint",
      popoverPinned
        ? "Fissato · Esc per chiudere"
        : "Badge: clicca per tenere aperto"
    );
    const footerActions = document.createElement("div");
    footerActions.className = "giac-popover-footer-actions";
    const webappUrl = getSafeWebappUrl();
    if (webappUrl) {
      const openWebappLink = appendTextElement(
        footerActions,
        "a",
        "giac-popover-open-app",
        "↗ Apri webapp"
      );
      openWebappLink.href = webappUrl;
      openWebappLink.target = "_blank";
      openWebappLink.rel = "noopener noreferrer";
      openWebappLink.setAttribute("aria-label", "Apri la webapp Giac in una nuova scheda");
    }
    const refreshButton = appendTextElement(footer, "button", "giac-popover-refresh", "↻ Aggiorna verifica");
    refreshButton.type = "button";
    refreshButton.addEventListener("click", async () => {
      refreshButton.disabled = true;
      refreshButton.textContent = "Aggiornamento…";
      await sendMessage({ type: "CLEAR_CACHE" });
      lastSignature = "";
      closePopover();
      scheduleRefresh(true);
    });
    footerActions.appendChild(refreshButton);
    footer.appendChild(footerActions);
    popover.appendChild(footer);
  }

  function positionPopover(popover, badge) {
    const badgeRect = badge.getBoundingClientRect();
    const margin = 12;
    const gap = 9;
    popover.hidden = false;
    popover.style.visibility = "hidden";
    popover.style.left = "0px";
    popover.style.top = "0px";

    const popoverRect = popover.getBoundingClientRect();
    const fitsBelow = badgeRect.bottom + gap + popoverRect.height <= window.innerHeight - margin;
    const fitsAbove = badgeRect.top - gap - popoverRect.height >= margin;
    const placeAbove = !fitsBelow && fitsAbove;
    let top = placeAbove
      ? badgeRect.top - popoverRect.height - gap
      : badgeRect.bottom + gap;
    let left = badgeRect.left;

    left = Math.min(left, window.innerWidth - popoverRect.width - margin);
    left = Math.max(margin, left);
    top = Math.max(margin, Math.min(top, window.innerHeight - popoverRect.height - margin));

    const arrowLeft = Math.max(
      18,
      Math.min(popoverRect.width - 18, badgeRect.left + badgeRect.width / 2 - left)
    );
    popover.classList.toggle("giac-popover-above", placeAbove);
    popover.style.setProperty("--giac-arrow-left", `${arrowLeft}px`);
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
    popover.style.visibility = "visible";
  }

  function openPopover(badge, pinned) {
    const data = badgeData.get(badge);
    if (!data) return;
    clearPopoverTimers();
    if (activeBadge && activeBadge !== badge) {
      activeBadge.setAttribute("aria-expanded", "false");
      activeBadge.classList.remove("giac-feedback-badge-active");
    }
    activeBadge = badge;
    popoverPinned = pinned;
    badge.setAttribute("aria-expanded", "true");
    badge.classList.add("giac-feedback-badge-active");
    const popover = createPopover();
    renderPopoverContent(popover, data.order, data.freshness);
    positionPopover(popover, badge);
  }

  function closePopover() {
    clearPopoverTimers();
    const popover = document.getElementById(POPOVER_ID);
    if (popover) popover.hidden = true;
    if (activeBadge) {
      activeBadge.setAttribute("aria-expanded", "false");
      activeBadge.classList.remove("giac-feedback-badge-active");
    }
    activeBadge = null;
    popoverPinned = false;
  }

  function setBadgeFeedback(entry, order, freshness) {
    const badge = ensureBadge(entry.targetCell);
    const normalizedOrder = {
      ...(order || {}),
      orderId: entry.orderId
    };
    badge.removeAttribute("title");
    badgeData.set(badge, { order: normalizedOrder, freshness: freshness || {} });
    renderBadge(badge, normalizedOrder);
    const stale = isFreshnessStale(freshness || {});
    badge.classList.toggle("giac-feedback-data-stale", stale);
    if (stale) {
      badge.setAttribute("aria-label", `${badge.getAttribute("aria-label")} Dati non aggiornati.`);
    }
    if (!entry.isDetail) {
      entry.row.dataset.giacFeedbackStatus = normalizedOrder.status;
      entry.row.classList.toggle("giac-order-blocked", normalizedOrder.status === "blocked");
      entry.row.classList.toggle("giac-order-protected", normalizedOrder.status === "protected");
    }
    if (activeBadge === badge) {
      const popover = createPopover();
      renderPopoverContent(popover, normalizedOrder, freshness || {});
      positionPopover(popover, badge);
    }
  }

  function renderError(entries, message) {
    for (const entry of entries) {
      setBadgeFeedback(entry, {
        status: "error",
        label: "Giac offline",
        reason: "Connessione non riuscita",
        reason_detail: message || "Impossibile contattare la webapp."
      }, {});
    }
    renderOrdersToolbar(entries, {});
  }

  async function refreshFeedback(force = false) {
    if (!extensionEnabled || !originAllowed() || !looksLikeOrdersPage()) return;
    const entries = collectOrderRows();
    if (entries.length === 0) return;

    const orderIds = entries.map(entry => entry.orderId);
    const signature = orderIds.join(",");
    const allBadgesPresent = entries.every(entry => (
      entry.targetCell.querySelector(`[${BADGE_ATTRIBUTE}]`)
    ));
    if (!force && signature === lastSignature && allBadgesPresent) return;
    lastSignature = signature;

    for (const entry of entries) {
      setBadgeFeedback(entry, {
        status: "loading",
        label: "Verifica…",
        reason: "Calcolo disponibilità",
        reason_detail: "La webapp sta verificando la sequenza cronologica e le giacenze."
      }, {});
    }
    renderOrdersToolbar(entries, {});

    const response = await sendMessage({ type: "FETCH_AVAILABILITY", orderIds });
    if (!response?.ok) {
      renderError(entries, response?.error);
      return;
    }

    const orders = response.data?.orders || {};
    for (const entry of entries) {
      const order = orders[String(entry.orderId)] || {
        status: "not_found",
        label: "Non sincronizzato",
        reason: "Ordine non presente nella webapp",
        reason_detail: "Sincronizza gli ordini PrestaShop e ripeti la verifica."
      };
      setBadgeFeedback(
        entry,
        { ...order, evaluation_mode: response.data?.policy?.evaluation_mode },
        response.data?.freshness
      );
    }
    renderOrdersToolbar(entries, response.data?.freshness || {});
  }

  function scheduleRefresh(force = false) {
    if (document.hidden) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => refreshFeedback(force), 450);
  }

  async function initialize() {
    const response = await sendMessage({ type: "GET_SETTINGS" });
    if (!response?.ok) return;
    extensionEnabled = response.settings?.enabled !== false;
    configuredOrigin = String(response.settings?.prestashopOrigin || "").trim();
    configuredWebappUrl = String(response.settings?.webappUrl || "").trim();
    chronologicalMode = response.settings?.chronologicalMode !== false;
    if (!extensionEnabled || !originAllowed() || !looksLikeOrdersPage()) return;

    createPopover();
    document.addEventListener("click", event => {
      const popover = document.getElementById(POPOVER_ID);
      if (
        activeBadge
        && !activeBadge.contains(event.target)
        && !popover?.contains(event.target)
      ) {
        closePopover();
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && activeBadge) closePopover();
    });
    window.addEventListener("resize", () => {
      if (activeBadge) positionPopover(createPopover(), activeBadge);
    });
    window.addEventListener("scroll", () => {
      if (activeBadge) positionPopover(createPopover(), activeBadge);
    }, true);

    scheduleRefresh(true);
    observer = new MutationObserver(() => scheduleRefresh(false));
    const observationRoot = document.querySelector("#content, main, .content-div") || document.body;
    observer.observe(observationRoot, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        lastSignature = "";
        scheduleRefresh(true);
      }
    });

    chrome.storage.onChanged.addListener(changes => {
      if (changes.enabled) extensionEnabled = changes.enabled.newValue !== false;
      if (changes.prestashopOrigin) configuredOrigin = changes.prestashopOrigin.newValue || "";
      if (changes.webappUrl) configuredWebappUrl = changes.webappUrl.newValue || "";
      if (changes.chronologicalMode) chronologicalMode = changes.chronologicalMode.newValue !== false;
      lastSignature = "";
      closePopover();
      scheduleRefresh(true);
    });
  }

  initialize();
})();
