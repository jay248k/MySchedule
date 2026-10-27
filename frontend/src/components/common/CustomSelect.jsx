import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  size = 'md',
  style = {},
  className = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Normalize options: can be array of strings or { value, label, color, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : opt.name || String(opt.value),
        color: opt.color,
        icon: opt.icon,
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOpt = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOpt ? selectedOpt.label : placeholder;

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: isSmall ? '130px' : '160px',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: isSmall ? '5px 10px' : '8px 14px',
          background: 'var(--card-bg)',
          color: 'var(--text-primary)',
          border: `1.5px solid ${isOpen ? 'var(--primary-color)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          fontSize: isSmall ? '0.8rem' : '0.86rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(var(--primary-rgb, 16, 185, 129), 0.12)' : 'var(--shadow-sm)',
          transition: 'all 0.15s ease',
          outline: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          {selectedOpt?.color && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: selectedOpt.color,
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {displayLabel}
          </span>
        </div>

        <ChevronDown
          size={isSmall ? 14 : 16}
          color="var(--text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Floating Dropdown List Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            minWidth: '100%',
            width: 'max-content',
            maxWidth: '280px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border-color)',
            padding: '5px',
            zIndex: 999,
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'fadeInUp 0.12s ease-out',
          }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);

            return (
              <div
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isSmall ? '6px 10px' : '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: isSmall ? '0.78rem' : '0.84rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                  background: isSelected ? 'rgba(var(--primary-rgb, 16, 185, 129), 0.12)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease',
                  gap: '8px',
                }}
                className="custom-select-option"
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--card-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {opt.color && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: opt.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                </div>

                {isSelected && (
                  <Check size={14} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
