import React from 'react';

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-container" style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          {Array(cols).fill(0).map((_, index) => (
            <div
              key={index}
              className="skeleton-pulse"
              style={{
                height: '16px',
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
              }}
            />
          ))}
        </div>

        {Array(rows).fill(0).map((_, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              gap: '16px',
              padding: '12px 0',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {Array(cols).fill(0).map((_, colIndex) => {
              const width = `${Math.max(42, 92 - colIndex * 11 - (rowIndex % 3) * 6)}%`;
              return (
                <div
                  key={colIndex}
                  className="skeleton-pulse"
                  style={{
                    height: '14px',
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.025)',
                    borderRadius: '4px',
                    maxWidth: colIndex === cols - 1 ? '80px' : width,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
