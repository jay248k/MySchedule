import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * CustomSelect - Reusable theme-based searchable dropdown component
 * 
 * Props:
 * - value: currently selected value
 * - onChange: callback(value, selectedOption)
 * - options: array of { value, label, color, icon, badge, description } or array of strings
 * - placeholder: string
 * - searchPlaceholder: string (default "Search options...")
 * - disabled: boolean
 * - icon: ReactNode (optional icon for the select trigger)
 * - className: string
 * - style: object
 * - menuStyle: object
 * - showSearch: boolean (default true)
 * - isClearable: boolean (default false)
 */
export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  icon = null,
  className = '',
  style = {},
  menuStyle = {},
  showSearch = true,
  isClearable = false,
  ariaLabel = 'Select option',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to { value, label, ... }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: opt, label: String(opt) };
      }
      return {
        ...opt,
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label || opt.name || opt.title || String(opt.value || opt.id || ''),
      };
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, showSearch]);

  const handleSelect = (option) => {
    if (onChange) {
      onChange(option.value, option);
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('', null);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        minWidth: '120px',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '9px 12px',
          background: 'var(--card-bg, #0F172A)',
          border: isOpen
            ? '1.5px solid var(--primary-color, #1769FF)'
            : '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: 'var(--radius-md, 10px)',
          color: selectedOption ? 'var(--text-primary, #FFFFFF)' : 'var(--text-muted, #94A3B8)',
          fontSize: '0.86rem',
          fontWeight: selectedOption ? 600 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(23, 105, 255, 0.2)'
            : 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.1))',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          textAlign: 'left',
          minHeight: '38px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          {icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
              {icon}
            </span>
          )}

          {selectedOption?.color && (
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: selectedOption.color,
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            />
          )}

          {selectedOption?.icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}

          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {isClearable && selectedOption && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              title="Clear selection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <X size={12} />
            </span>
          )}

          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-muted, #94A3B8)',
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu Modal / Popover */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: 'var(--card-bg, #0F172A)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
            borderRadius: 'var(--radius-md, 12px)',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            padding: '6px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            animation: 'fadeIn 0.15s ease-out',
            ...menuStyle,
          }}
        >
          {/* Search Bar inside Dropdown */}
          {showSearch && (
            <div
              style={{
                position: 'relative',
                padding: '4px 6px',
                borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                marginBottom: '4px',
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #94A3B8)',
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 32px',
                  background: 'var(--page-bg, #090D16)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  borderRadius: 'var(--radius-sm, 6px)',
                  color: 'var(--text-primary, #FFFFFF)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Options Scroll List */}
          <div
            ref={listRef}
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              paddingRight: '2px',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--text-muted, #94A3B8)',
                  fontSize: '0.8rem',
                }}
              >
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm, 6px)',
                      background: isSelected
                        ? 'rgba(var(--primary-rgb, 23, 105, 255), 0.18)'
                        : 'transparent',
                      color: isSelected
                        ? 'var(--primary-color, #38BDF8)'
                        : 'var(--text-primary, #FFFFFF)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--card-hover, rgba(255, 255, 255, 0.06))';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      {opt.color && (
                        <span
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            background: opt.color,
                            flexShrink: 0,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          }}
                        />
                      )}

                      {opt.icon && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                          {opt.icon}
                        </span>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted, #94A3B8)',
                              fontWeight: 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '999px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-secondary, #94A3B8)',
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}

                      {isSelected && (
                        <Check size={14} strokeWidth={2.8} color="var(--primary-color, #38BDF8)" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
