'use client';

import { useState, useRef } from 'react';
import { LoftModal } from './LoftModal';

interface AddMediaPageModalProps {
  open: boolean;
  onClose: () => void;
  type: 'image' | 'video';
  onConfirm: (title: string, urlOrDataUrl: string) => void;
}

export function AddMediaPageModal({
  open,
  onClose,
  type,
  onConfirm,
}: AddMediaPageModalProps) {
  const [title, setTitle] = useState(type === 'image' ? 'Image' : 'Video');
  const [url, setUrl] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'image' ? 'image/*' : 'video/*';
  const typeLabel = type === 'image' ? 'Image' : 'Video';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFilePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
      setUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = filePreview || url.trim();
    if (!value) return;
    onConfirm(title.trim() || typeLabel, value);
    setTitle(type === 'image' ? 'Image' : 'Video');
    setUrl('');
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleClose = () => {
    setUrl('');
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <LoftModal open={open} onClose={handleClose} title={`Add ${typeLabel} Page`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-loft-black mb-1 uppercase tracking-wide">
            Page Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-loft-black px-3 py-2 font-sans text-loft-black focus:outline-none focus:ring-2 focus:ring-loft-yellow"
            placeholder={`${typeLabel} title`}
          />
        </div>

        {!filePreview && (
          <div>
            <label className="block text-sm font-bold text-loft-black mb-1 uppercase tracking-wide">
              URL (optional if uploading)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border-2 border-loft-black px-3 py-2 font-sans text-loft-black focus:outline-none focus:ring-2 focus:ring-loft-yellow"
              placeholder={type === 'image' ? 'https://...' : 'https://...'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-loft-black mb-1 uppercase tracking-wide">
            {filePreview ? 'Selected file' : 'Or upload file'}
          </label>
          {filePreview ? (
            <div className="flex items-center gap-3 border-2 border-loft-black p-3">
              {type === 'image' && (
                <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover border border-loft-black" />
              )}
              {type === 'video' && (
                <video src={filePreview} className="h-16 w-24 object-cover border border-loft-black" muted />
              )}
              <button
                type="button"
                onClick={handleClearFile}
                className="px-3 py-1 bg-loft-gray text-loft-black border-2 border-loft-black font-bold text-sm hover:bg-gray-300"
              >
                REMOVE
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-loft-black p-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                id={`add-media-file-${type}`}
              />
              <label
                htmlFor={`add-media-file-${type}`}
                className="cursor-pointer px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold inline-block shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                CHOOSE FILE
              </label>
            </div>
          )}
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
            disabled={!filePreview && !url.trim()}
            className="px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_#1A1A1A] hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            ADD
          </button>
        </div>
      </form>
    </LoftModal>
  );
}
