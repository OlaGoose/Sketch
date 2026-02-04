'use client';

import { useCallback, useRef, useEffect } from 'react';

/** Speech bubble above voice marker: rounded rect + pointer + small circle. Editable text, adaptive size. */
export function SpeechBubble({
  value,
  onChange,
  placeholder = 'Thoughts?',
  readOnly = false,
}: {
  value: string;
  onChange?: (text: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el || el === document.activeElement) return;
    if (el.innerText !== value) el.innerText = value;
  }, [value]);

  const handleInput = useCallback(() => {
    const el = divRef.current;
    if (el && onChange) onChange(el.innerText || '');
  }, [onChange]);

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 flex flex-col items-center pointer-events-auto w-max"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative flex flex-col items-center w-full">
        <div className="bg-white rounded-[20px] px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] min-w-[72px] max-w-[720px] w-fit">
          {readOnly ? (
            <div
              ref={divRef}
              className="text-[#5B5B5B] font-sans font-medium text-sm whitespace-pre-wrap break-words"
            >
              {value || placeholder}
            </div>
          ) : (
            <div
              ref={divRef}
              contentEditable
              suppressContentEditableWarning
              className="text-[#5B5B5B] font-sans font-medium text-sm outline-none whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
              data-placeholder={placeholder}
              style={{ caretColor: '#FF69B4' }}
              onInput={handleInput}
            />
          )}
        </div>
        <div className="relative flex justify-center">
          <div
            className="h-4 w-4 bg-white -mt-[10px] rotate-45 rounded-br-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          />
          <div
            className="absolute left-1/2 top-0 w-2 h-2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
            style={{ transform: 'translate(calc(-50% - 6px), 5px)' }}
          />
        </div>
      </div>
    </div>
  );
}
