import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Pencil, Check, List } from 'lucide-react';

export interface EditableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  className?: string;
}

export interface EditableSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: EditableSelectOption[];
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  manualPlaceholder?: string;
  inputType?: 'text' | 'number';
  ariaLabel?: string;
  title?: string;
  compact?: boolean;
  /**
   * When true, typing in manual mode keeps a local draft and only calls `onChange`
   * when the user presses Enter, clicks the confirm Check button, or blurs the input.
   * Useful for selects that trigger immediate API / Supabase updates on change.
   */
  commitManualOnConfirm?: boolean;
}

const MANUAL_SENTINEL = '__EDITABLE_SELECT_MANUAL__';

export default function EditableSelect({
  value,
  defaultValue,
  onChange,
  options,
  name,
  required,
  disabled,
  className = '',
  containerClassName = 'w-full',
  manualPlaceholder = 'Write manually...',
  inputType = 'text',
  ariaLabel,
  title,
  compact = false,
  commitManualOnConfirm = false,
}: EditableSelectProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    isControlled ? String(value ?? '') : String(defaultValue ?? '')
  );
  const [isManual, setIsManual] = useState<boolean>(false);
  const [manualDraft, setManualDraft] = useState<string>(
    isControlled ? String(value ?? '') : String(defaultValue ?? '')
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const skipNextBlurCommitRef = useRef<boolean>(false);

  // Sync controlled value or reset when defaultValue changes externally
  useEffect(() => {
    if (isControlled) {
      const next = String(value ?? '');
      setInternalValue(next);
      if (!isManual) {
        setManualDraft(next);
      }
    }
  }, [isControlled, value, isManual]);

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      const next = String(defaultValue);
      setInternalValue(next);
      setManualDraft(next);
    }
  }, [isControlled, defaultValue]);

  const currentValue = isControlled ? String(value ?? '') : internalValue;
  const hasMatchingOption = options.some((opt) => opt.value === currentValue);

  const enterManualMode = () => {
    if (disabled) return;
    const initialDraft = currentValue === 'ALL' ? '' : currentValue;
    setManualDraft(initialDraft);
    setIsManual(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (initialDraft) {
          inputRef.current.select();
        }
      }
    }, 10);
  };

  const commitManualDraft = (rawDraft: string) => {
    const trimmed = rawDraft.trim();
    const finalVal = trimmed || currentValue;
    if (!isControlled) {
      setInternalValue(finalVal);
    }
    if (finalVal !== currentValue) {
      onChange?.(finalVal);
    }
    setManualDraft(finalVal);
  };

  const exitManualMode = () => {
    if (commitManualOnConfirm && manualDraft.trim() && manualDraft.trim() !== currentValue) {
      commitManualDraft(manualDraft);
    }
    setIsManual(false);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (next === MANUAL_SENTINEL) {
      enterManualMode();
      return;
    }
    if (!isControlled) {
      setInternalValue(next);
    }
    setManualDraft(next);
    onChange?.(next);
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setManualDraft(next);
    if (!commitManualOnConfirm) {
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    }
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && commitManualOnConfirm) {
      e.preventDefault();
      skipNextBlurCommitRef.current = true;
      commitManualDraft(manualDraft);
      setIsManual(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      skipNextBlurCommitRef.current = true;
      setManualDraft(currentValue);
      setIsManual(false);
    }
  };

  const handleManualBlur = () => {
    if (skipNextBlurCommitRef.current) {
      skipNextBlurCommitRef.current = false;
      return;
    }
    if (commitManualOnConfirm) {
      commitManualDraft(manualDraft);
    }
  };

  // Strip native right-padding classes from passed className so our right-icon padding wins cleanly
  const baseClassName = className
    .replace(/\bappearance-none\b/g, '')
    .trim();

  if (isManual) {
    return (
      <div className={`relative flex items-center min-w-0 ${containerClassName}`}>
        <input
          ref={inputRef}
          type={inputType}
          name={name}
          required={required}
          disabled={disabled}
          value={commitManualOnConfirm ? manualDraft : currentValue}
          onChange={handleManualInputChange}
          onKeyDown={handleManualKeyDown}
          onBlur={handleManualBlur}
          placeholder={manualPlaceholder}
          aria-label={ariaLabel || manualPlaceholder}
          title={title || 'Type custom value manually'}
          className={`${baseClassName} w-full ${
            commitManualOnConfirm
              ? compact
                ? 'pr-12'
                : 'pr-16'
              : compact
              ? 'pr-7'
              : 'pr-9'
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-0.5">
          {commitManualOnConfirm && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                skipNextBlurCommitRef.current = true;
                commitManualDraft(manualDraft);
                setIsManual(false);
              }}
              className={`${
                compact ? 'w-5 h-5' : 'w-7 h-7'
              } rounded-md flex items-center justify-center bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition cursor-pointer`}
              title="Apply manual value"
              aria-label="Apply manual value"
            >
              <Check className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </button>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={exitManualMode}
            className={`${
              compact ? 'w-5 h-5' : 'w-7 h-7'
            } rounded-md flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition cursor-pointer`}
            title="Switch back to dropdown options"
            aria-label="Switch back to dropdown options"
          >
            <List className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center min-w-0 ${containerClassName}`}>
      <select
        name={name}
        required={required}
        disabled={disabled}
        value={currentValue}
        onChange={handleSelectChange}
        aria-label={ariaLabel}
        title={title}
        className={`${baseClassName} w-full appearance-none truncate ${
          compact ? 'pr-10' : 'pr-12 sm:pr-14'
        }`}
      >
        {!hasMatchingOption && currentValue !== '' && (
          <option value={currentValue} className="bg-white text-slate-900">
            {currentValue} (Custom)
          </option>
        )}
        {options.map((opt) => (
          <option
            key={`${opt.value}::${opt.label}`}
            value={opt.value}
            disabled={opt.disabled}
            className={opt.className || 'bg-white text-slate-900'}
          >
            {opt.label}
          </option>
        ))}
        <option
          value={MANUAL_SENTINEL}
          className="bg-white text-slate-900 font-semibold"
        >
          ✏️ Other / Write Manually...
        </option>
      </select>

      {/* Down Arrow + Pencil Symbol right beside it */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-0.5">
        <span
          className={`pointer-events-none flex items-center justify-center text-slate-500 ${
            compact ? 'w-4 h-4' : 'w-5 h-5'
          }`}
          aria-hidden="true"
        >
          <ChevronDown className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        </span>
        <span className={`w-px bg-slate-200 ${compact ? 'h-3.5' : 'h-4'}`} aria-hidden="true" />
        <button
          type="button"
          disabled={disabled}
          onClick={enterManualMode}
          className={`${
            compact ? 'w-5 h-5' : 'w-7 h-7'
          } rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40`}
          title="Write manually instead of choosing from dropdown"
          aria-label="Write manually"
        >
          <Pencil className={compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
        </button>
      </div>
    </div>
  );
}
