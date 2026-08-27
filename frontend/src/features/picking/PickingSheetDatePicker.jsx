import { useEffect, useMemo, useRef, useState } from 'react';


const DAY_KEYS = [
  'sunday', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday',
];
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];


function parseDate(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day, 12);
}


function isoDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function todayInRome() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}


function isEnabled(date, dayMapping) {
  return Boolean(dayMapping?.[DAY_KEYS[date.getDay()]]);
}


function adjacentEnabledDate(value, direction, dayMapping) {
  const date = parseDate(value);
  for (let offset = 0; offset < 14; offset += 1) {
    date.setDate(date.getDate() + direction);
    if (isEnabled(date, dayMapping)) return isoDate(date);
  }
  return value;
}


function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}


function ChevronIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === 'previous' ? 'm14.5 6-6 6 6 6' : 'm9.5 6 6 6-6 6'} />
    </svg>
  );
}


export function PickingSheetDatePicker({ value, onChange, dayMapping, disabled }) {
  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: selected.getFullYear(),
    month: selected.getMonth(),
  }));
  const rootRef = useRef(null);
  const today = todayInRome();

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const days = useMemo(() => {
    const first = new Date(visibleMonth.year, visibleMonth.month, 1, 12);
    const leading = (first.getDay() + 6) % 7;
    const count = new Date(visibleMonth.year, visibleMonth.month + 1, 0, 12).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from(
        { length: count },
        (_, index) => new Date(visibleMonth.year, visibleMonth.month, index + 1, 12),
      ),
    ];
  }, [visibleMonth]);

  const monthLabel = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(visibleMonth.year, visibleMonth.month, 1, 12));
  const displayValue = new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(selected);

  const showCalendar = () => {
    setVisibleMonth({ year: selected.getFullYear(), month: selected.getMonth() });
    setOpen(current => !current);
  };

  const changeMonth = direction => {
    setVisibleMonth(current => {
      const date = new Date(current.year, current.month + direction, 1, 12);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const select = date => {
    onChange(isoDate(date));
    setOpen(false);
  };

  return (
    <div className="picking-date-picker" ref={rootRef}>
      <span className="picking-date-label">Data del prelievo</span>
      <div className="picking-date-stepper">
        <button
          type="button"
          className="picking-date-step"
          onClick={() => onChange(adjacentEnabledDate(value, -1, dayMapping))}
          aria-label="Giorno configurato precedente"
          disabled={disabled}
        >
          <ChevronIcon direction="previous" />
        </button>
        <button
          type="button"
          className="picking-date-trigger"
          onClick={showCalendar}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
        >
          <CalendarIcon />
          <span>{displayValue}</span>
        </button>
        <button
          type="button"
          className="picking-date-step"
          onClick={() => onChange(adjacentEnabledDate(value, 1, dayMapping))}
          aria-label="Giorno configurato successivo"
          disabled={disabled}
        >
          <ChevronIcon direction="next" />
        </button>
      </div>

      {open && (
        <div className="picking-calendar" role="dialog" aria-label="Scegli la data del prelievo">
          <div className="picking-calendar-head">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Mese precedente"><ChevronIcon direction="previous" /></button>
            <strong>{monthLabel}</strong>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Mese successivo"><ChevronIcon direction="next" /></button>
          </div>
          <div className="picking-calendar-weekdays" aria-hidden="true">
            {WEEKDAYS.map(day => <span key={day}>{day}</span>)}
          </div>
          <div className="picking-calendar-grid">
            {days.map((date, index) => date ? (
              <button
                type="button"
                key={isoDate(date)}
                className={`${isoDate(date) === value ? 'selected' : ''} ${isoDate(date) === today ? 'today' : ''}`}
                onClick={() => select(date)}
                disabled={!isEnabled(date, dayMapping)}
                aria-pressed={isoDate(date) === value}
                title={!isEnabled(date, dayMapping) ? 'Giorno non configurato' : undefined}
              >
                {date.getDate()}
              </button>
            ) : <span key={`empty-${index}`} />)}
          </div>
          <div className="picking-calendar-footer">
            <span>I giorni non configurati non sono selezionabili.</span>
            <button
              type="button"
              onClick={() => select(parseDate(today))}
              disabled={!isEnabled(parseDate(today), dayMapping)}
            >
              Oggi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
