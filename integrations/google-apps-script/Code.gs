/**
 * Giac - registrazione sicura dei prelievi nel Google Sheet collegato.
 *
 * 1. Impostare GIAC_SHARED_SECRET nelle Proprietà script.
 * 2. Eseguire setupGiac una sola volta dall'editor.
 * 3. Distribuire come Applicazione web, esegui come proprietario, accesso Chiunque.
 */

const GIAC_OPERATION_HISTORY_LIMIT = 500;
const GIAC_REQUEST_MAX_AGE_SECONDS = 300;
const GIAC_SCRIPT_VERSION = '2.0.0';

function setupGiac() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Apri Apps Script dal foglio Google da collegare.');
  }
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty('GIAC_SHARED_SECRET') || '';
  if (secret.length < 32) {
    throw new Error(
      'Configura GIAC_SHARED_SECRET (almeno 32 caratteri) nelle Proprietà script.'
    );
  }
  properties.setProperty('GIAC_SPREADSHEET_ID', spreadsheet.getId());
  return `Foglio collegato: ${spreadsheet.getName()}`;
}

function doPost(event) {
  try {
    const envelope = JSON.parse(event.postData.contents || '{}');
    const payloadText = String(envelope.payload || '');
    const signature = String(envelope.signature || '');
    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty('GIAC_SHARED_SECRET') || '';

    if (secret.length < 32 || !secureEquals(signature, hmacHex(payloadText, secret))) {
      return jsonResponse({ ok: false, error: 'Firma della richiesta non valida.' });
    }

    const request = JSON.parse(payloadText);
    const now = Math.floor(Date.now() / 1000);
    if (!request.timestamp || Math.abs(now - Number(request.timestamp)) > GIAC_REQUEST_MAX_AGE_SECONDS) {
      return jsonResponse({ ok: false, error: 'Richiesta scaduta. Riprova dalla web app.' });
    }

    if (request.action === 'health') return handleHealth(request, properties);
    if (request.action === 'preview') return handlePreview(request, properties);
    if (request.action === 'apply') return handleApply(request, properties);
    return jsonResponse({ ok: false, error: 'Azione Apps Script non riconosciuta.' });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error.message || error) });
  }
}

function handleHealth(request, properties) {
  const sheet = resolveSheet(request.sheet_name, properties);
  const headers = readHeaders(sheet);
  findHeaderIndex(headers, request.sku_header, true);
  if (request.exclude_return_lots) {
    findHeaderIndex(headers, request.lot_header, true);
  }
  return jsonResponse({
    ok: true,
    action: 'health',
    script_version: GIAC_SCRIPT_VERSION,
    sheet_name: sheet.getName(),
    headers,
  });
}

function handlePreview(request, properties) {
  const result = buildPreview(request, properties);
  return jsonResponse({ ok: true, action: 'preview', ...result });
}

function handleApply(request, properties) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return jsonResponse({
      ok: false,
      error: 'È già in corso una registrazione sul foglio. Riprova tra pochi secondi.',
    });
  }

  try {
    const operationId = String(request.operation_id || '');
    if (!operationId) throw new Error('ID operazione mancante.');
    const applied = readAppliedOperations(properties);
    if (applied.some(item => item.id === operationId)) {
      return jsonResponse({
        ok: true,
        action: 'apply',
        script_version: GIAC_SCRIPT_VERSION,
        idempotent: true,
        updated_cells: 0,
        operation_id: operationId,
        sheet_name: request.sheet_name,
        target_header: request.target_header,
      });
    }

    const current = buildPreview(request, properties);
    if (!current.can_apply) {
      const details = [
        ...current.errors,
        ...current.skipped.map(item => `${item.sku}: ${item.reason}`),
      ];
      return jsonResponse({
        ok: false,
        error: `Il foglio è cambiato: ${details.join(' ')}`,
      });
    }

    if (current.items.length !== (request.items || []).length) {
      return jsonResponse({
        ok: false,
        error: 'Uno o più SKU registrabili sono cambiati. Genera una nuova anteprima.',
      });
    }

    if (
      String(request.script_version || '') !== GIAC_SCRIPT_VERSION
      || !request.sheet_revision
      || String(request.sheet_revision) !== String(current.sheet_revision)
    ) {
      return jsonResponse({
        ok: false,
        error: 'La struttura del foglio è cambiata. Genera una nuova anteprima.',
      });
    }

    const expectedBySku = new Map(
      (request.items || []).map(item => [normalize(item.sku), item])
    );
    for (const item of current.items) {
      const expected = expectedBySku.get(normalize(item.sku));
      if (
        !expected
        || Number(expected.row) !== Number(item.row)
        || Number(expected.current_value) !== Number(item.current_value)
      ) {
        return jsonResponse({
          ok: false,
          error: `La riga o il valore di ${item.sku} è cambiato. Genera una nuova anteprima.`,
        });
      }
    }

    const sheet = resolveSheet(request.sheet_name, properties);
    writeCurrentItems(sheet, request, current);
    SpreadsheetApp.flush();
    rememberAppliedOperation(properties, applied, operationId);

    return jsonResponse({
      ok: true,
      action: 'apply',
      script_version: GIAC_SCRIPT_VERSION,
      operation_id: operationId,
      sheet_name: sheet.getName(),
      target_header: current.target_header,
      updated_cells: current.items.length,
      idempotent: false,
    });
  } finally {
    lock.releaseLock();
  }
}

function buildPreview(request, properties) {
  const sheet = resolveSheet(request.sheet_name, properties);
  const headers = readHeaders(sheet);
  const skuColumn = findHeaderIndex(headers, request.sku_header, true) + 1;
  const excludeReturnLots = Boolean(request.exclude_return_lots);
  const lotIndex = excludeReturnLots
    ? findHeaderIndex(headers, request.lot_header, true)
    : -1;
  const excludedLotKeywords = normalizeKeywords(request.excluded_lot_keywords);
  const remainingIndex = findHeaderIndex(headers, request.remaining_header, false);
  const target = findTargetDayHeader(headers, request.day_label, request.target_date);
  const lastRow = sheet.getLastRow();
  const dataRange = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())
    : null;
  const rawValues = dataRange ? dataRange.getValues() : [];
  const displayValues = dataRange ? dataRange.getDisplayValues() : [];
  const skuRows = new Map();
  const seenSkus = new Set();
  const skippedRowsBySku = new Map();

  displayValues.forEach((row, index) => {
    const sku = normalize(row[skuColumn - 1]);
    if (!sku) return;
    seenSkus.add(sku);
    if (
      excludeReturnLots
      && isExcludedLot(row[lotIndex], excludedLotKeywords)
    ) {
      skippedRowsBySku.set(sku, (skippedRowsBySku.get(sku) || 0) + 1);
      return;
    }
    // Conserva intenzionalmente la prima riga valida nell'ordine del foglio.
    if (!skuRows.has(sku)) skuRows.set(sku, index + 2);
  });

  const errors = [];
  const skipped = [];
  const resultItems = [];
  (request.items || []).forEach(rawItem => {
    const sku = normalize(rawItem.sku);
    const quantity = Number(rawItem.quantity);
    if (!sku || !Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`Riga SKU non valida: ${rawItem.sku || 'senza SKU'}.`);
      return;
    }
    const row = skuRows.get(sku);
    if (!row) {
      skipped.push({
        sku,
        quantity,
        reason: seenSkus.has(sku)
          ? 'Presente solo in righe escluse dal calcolo.'
          : 'Non trovato nel foglio.',
      });
      return;
    }
    const rowIndex = row - 2;
    const currentValue = numericValue(rawValues[rowIndex][target.index]);
    const remainingCurrent = remainingIndex >= 0
      ? numericValue(rawValues[rowIndex][remainingIndex])
      : null;
    resultItems.push({
      sku,
      row,
      quantity,
      current_value: currentValue,
      new_value: currentValue + quantity,
      remaining_current: remainingCurrent,
      remaining_after: remainingCurrent === null ? null : remainingCurrent - quantity,
      excluded_rows_skipped: skippedRowsBySku.get(sku) || 0,
    });
  });

  return {
    script_version: GIAC_SCRIPT_VERSION,
    sheet_revision: buildSheetRevision({
      headers,
      displayValues,
      skuIndex: skuColumn - 1,
      lotIndex,
      target,
    }),
    sheet_name: sheet.getName(),
    target_header: target.header,
    target_column: columnLetter(target.index + 1),
    target_column_index: target.index + 1,
    items: resultItems,
    errors,
    skipped,
    can_apply: errors.length === 0 && resultItems.length > 0,
  };
}

function writeCurrentItems(sheet, request, current) {
  const headers = readHeaders(sheet);
  const skuIndex = findHeaderIndex(headers, request.sku_header, true);
  const excludeReturnLots = Boolean(request.exclude_return_lots);
  const lotIndex = excludeReturnLots
    ? findHeaderIndex(headers, request.lot_header, true)
    : -1;
  const excludedLotKeywords = normalizeKeywords(request.excluded_lot_keywords);
  const targetIndex = findHeaderIndex(headers, current.target_header, true);

  if (targetIndex + 1 !== Number(current.target_column_index)) {
    throw new Error(
      'La colonna di destinazione è cambiata. Genera una nuova anteprima.'
    );
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const liveRange = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, lastColumn)
    : null;
  const liveDisplayValues = liveRange ? liveRange.getDisplayValues() : [];
  const liveRawValues = liveRange ? liveRange.getValues() : [];
  const verifiedWrites = current.items.map(item => {
    const rowNumber = Number(item.row);
    if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > lastRow) {
      throw new Error(`La riga dello SKU ${item.sku} non è più valida.`);
    }

    const displayRow = liveDisplayValues[rowNumber - 2];
    const rawRow = liveRawValues[rowNumber - 2];
    if (normalize(displayRow[skuIndex]) !== normalize(item.sku)) {
      throw new Error(
        `Lo SKU ${item.sku} non si trova più alla riga prevista. Genera una nuova anteprima.`
      );
    }
    if (
      excludeReturnLots
      && isExcludedLot(displayRow[lotIndex], excludedLotKeywords)
    ) {
      throw new Error(
        `La riga dello SKU ${item.sku} è ora esclusa dal calcolo. Genera una nuova anteprima.`
      );
    }

    if (Number(numericValue(rawRow[targetIndex])) !== Number(item.current_value)) {
      throw new Error(
        `Il valore di ${item.sku} è cambiato. Genera una nuova anteprima.`
      );
    }
    return {
      row: rowNumber,
      value: Number(item.new_value),
    };
  }).sort((left, right) => left.row - right.row);

  // Raggruppa soltanto righe consecutive: non vengono mai riscritte celle
  // estranee agli SKU del prelievo.
  const groups = [];
  verifiedWrites.forEach(write => {
    const group = groups[groups.length - 1];
    if (group && write.row === group.startRow + group.values.length) {
      group.values.push([write.value]);
    } else {
      groups.push({ startRow: write.row, values: [[write.value]] });
    }
  });
  groups.forEach(group => {
    sheet.getRange(
      group.startRow,
      targetIndex + 1,
      group.values.length,
      1
    ).setValues(group.values);
  });
}

function buildSheetRevision({ headers, displayValues, skuIndex, lotIndex, target }) {
  const rows = displayValues.map((row, index) => [
    index + 2,
    normalize(row[skuIndex]),
    lotIndex >= 0 ? normalize(row[lotIndex]) : '',
  ].join('\u001f'));
  return sha256Hex([
    GIAC_SCRIPT_VERSION,
    headers.map(normalize).join('\u001f'),
    `${target.index + 1}:${normalize(target.header)}`,
    ...rows,
  ].join('\u001e'));
}

function resolveSheet(sheetName, properties) {
  const spreadsheetId = properties.getProperty('GIAC_SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('Esegui setupGiac una volta dall’editor Apps Script.');
  }
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(String(sheetName || ''));
  if (!sheet) throw new Error(`Scheda "${sheetName}" non trovata.`);
  return sheet;
}

function readHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) throw new Error('Il foglio non contiene intestazioni.');
  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
    .map(value => String(value || '').trim());
}

function findHeaderIndex(headers, expected, required) {
  const normalizedExpected = normalize(expected);
  const index = headers.findIndex(header => normalize(header) === normalizedExpected);
  if (index < 0 && required) {
    throw new Error(`Colonna "${expected}" non trovata.`);
  }
  return index;
}

function findTargetDayHeader(headers, dayLabel, targetDate) {
  const parsedDate = new Date(`${targetDate}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) throw new Error('Data prelievo non valida.');
  const dayNumber = parsedDate.getDate();
  const normalizedLabel = normalize(dayLabel);
  const candidates = headers
    .map((header, index) => ({ header, index, normalized: normalize(header) }))
    .filter(item => item.normalized.startsWith(normalizedLabel));
  const exact = candidates.find(item => {
    const numbers = item.normalized.match(/\d+/g) || [];
    return numbers.some(value => Number(value) === dayNumber);
  });
  if (exact) return exact;
  if (candidates.length === 1 && candidates[0].normalized === normalizedLabel) {
    return candidates[0];
  }
  throw new Error(
    `Colonna per ${dayLabel} ${dayNumber} non trovata. Aggiorna le date nel foglio.`
  );
}

function numericValue(value) {
  if (value === '' || value === null) return 0;
  const parsed = typeof value === 'number'
    ? value
    : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) throw new Error(`Valore numerico non valido: ${value}`);
  return parsed;
}

function normalizeKeywords(values) {
  const result = [];
  (Array.isArray(values) ? values : []).forEach(value => {
    const keyword = normalize(value);
    if (keyword && !result.includes(keyword)) result.push(keyword);
  });
  return result;
}

function isExcludedLot(value, keywords) {
  const lot = normalize(value);
  if (!lot) return false;
  return keywords.some(keyword => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^A-Z0-9_])${escaped}($|[^A-Z0-9_])`, 'i').test(lot);
  });
}

function normalize(value) {
  return String(value || '').trim().toUpperCase();
}

function columnLetter(column) {
  let result = '';
  let current = column;
  while (current > 0) {
    current -= 1;
    result = String.fromCharCode(65 + (current % 26)) + result;
    current = Math.floor(current / 26);
  }
  return result;
}

function readAppliedOperations(properties) {
  try {
    const parsed = JSON.parse(properties.getProperty('GIAC_APPLIED_OPERATIONS') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function rememberAppliedOperation(properties, operations, operationId) {
  const next = [
    ...operations.filter(item => item.id !== operationId),
    { id: operationId, applied_at: new Date().toISOString() },
  ].slice(-GIAC_OPERATION_HISTORY_LIMIT);
  properties.setProperty('GIAC_APPLIED_OPERATIONS', JSON.stringify(next));
}

function hmacHex(payload, secret) {
  return Utilities.computeHmacSha256Signature(
    payload,
    secret,
    Utilities.Charset.UTF_8
  ).map(byte => ((byte + 256) % 256).toString(16).padStart(2, '0')).join('');
}

function sha256Hex(value) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  ).map(byte => ((byte + 256) % 256).toString(16).padStart(2, '0')).join('');
}

function secureEquals(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
