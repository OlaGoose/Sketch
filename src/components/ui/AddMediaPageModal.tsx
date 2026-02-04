'use client';

import { useState, useRef, useCallback } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { LoftModal } from './LoftModal';

export interface AddMediaItem {
  title: string;
  urlOrDataUrl: string;
}

interface AddMediaPageModalProps {
  open: boolean;
  onClose: () => void;
  type: 'image' | 'video';
  onConfirm: (items: AddMediaItem[]) => void;
}

export function AddMediaPageModal({
  open,
  onClose,
  type,
  onConfirm,
}: AddMediaPageModalProps) {
  const [defaultTitle, setDefaultTitle] = useState(type === 'image' ? 'Image' : 'Video');
  const [urlInput, setUrlInput] = useState('');
  const [items, setItems] = useState<{ id: string; urlOrDataUrl: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'image' ? 'image/*' : 'video/*';
  const typeLabel = type === 'image' ? 'Image' : 'Video';

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newItems: { id: string; urlOrDataUrl: string }[] = [];
    let loaded = 0;
    const total = files.length;
    const done = () => {
      loaded += 1;
      if (loaded === total) {
        setItems((prev) => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        newItems.push({
          id: `f-${Date.now()}-${i}`,
          urlOrDataUrl: reader.result as string,
        });
        done();
      };
      reader.readAsDataURL(file);
    }
    if (total === 0) done();
  }, []);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { id: `u-${Date.now()}`, urlOrDataUrl: trimmed }]);
    setUrlInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleBase = defaultTitle.trim() || typeLabel;
    const result: AddMediaItem[] = items.map((it, i) => ({
      title: items.length > 1 ? `${titleBase} ${i + 1}` : titleBase,
      urlOrDataUrl: it.urlOrDataUrl,
    }));
    if (result.length === 0) return;
    onConfirm(result);
    setItems([]);
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleClose = () => {
    setItems([]);
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <LoftModal open={open} onClose={handleClose} title={`Add ${typeLabel} Page(s)`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-loft-black mb-1 uppercase tracking-wide">
            Page Title {items.length > 1 ? '(prefix)' : ''}
          </label>
          <input
            type="text"
            value={defaultTitle}
            onChange={(e) => setDefaultTitle(e.target.value)}
            className="w-full border-2 border-loft-black px-3 py-2 font-sans text-loft-black focus:outline-none focus:ring-2 focus:ring-loft-yellow"
            placeholder={`${typeLabel} title`}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-loft-black mb-1 uppercase tracking-wide">
            URL (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              className="flex-1 border-2 border-loft-black px-3 py-2 font-sans text-loft-black focus:outline-none focus:ring-2 focus:ring-loft-yellow"
              placeholder="https://..."
            />
            <button
              type="button"
              onClick={addUrl}
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] disabled:opacity-50 disabled:pointer-events-none"
            >
              ADD
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-loft-black mb-1 uppercase tracking-wide">
            {items.length ? `Uploaded / added (${items.length})` : 'Or upload file(s)'}
          </label>
          {items.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto border-2 border-loft-black p-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="relative aspect-square border-2 border-loft-black bg-black group/thumb"
                >
                  {type === 'image' ? (
                    <img src={it.urlOrDataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={it.urlOrDataUrl} className="w-full h-full object-cover" muted />
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-600 text-white border border-white rounded opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-2 border-2 border-dashed border-loft-black p-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple
              onChange={handleFileChange}
              className="hidden"
              id={`add-media-file-${type}`}
            />
            <label
              htmlFor={`add-media-file-${type}`}
              className="cursor-pointer px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold inline-block shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              CHOOSE FILE(S)
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-loft-gray text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={items.length === 0}
            className="px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            ADD {items.length > 1 ? `${items.length} PAGES` : 'PAGE'}
          </button>
        </div>
      </form>
    </LoftModal>
  );
}
