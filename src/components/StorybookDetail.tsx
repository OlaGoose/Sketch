'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import {
  getStorybookById,
  saveStorybook,
  deleteStorybook,
  getPagesByStorybookId,
  savePage,
  deletePage,
} from '@/lib/db/cinematic-db';
import type { Storybook, StorybookPage } from '@/types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDialog } from './DialogProvider';
import { AddMediaPageModal, type AddMediaItem } from './ui/AddMediaPageModal';
import { getVideoPosterUrl } from '@/utils/video-poster';
import { Header } from './Header';

interface StorybookDetailProps {
  storybookId: string;
}

const PAGE_TYPE_ICONS = {
  text: DocumentTextIcon,
  webpage: GlobeAltIcon,
  image: PhotoIcon,
  'audio-image': SpeakerWaveIcon,
  video: VideoCameraIcon,
};

const PAGE_TYPE_LABELS = {
  text: 'Text',
  webpage: 'Webpage',
  image: 'Image',
  'audio-image': 'Audio Image',
  video: 'Video',
};

const FOLDER_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']);
const FOLDER_VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv']);
const FOLDER_TEXT_EXTS = new Set(['txt', 'md']);

function SortablePageCard({
  page,
  index,
  onDelete,
}: {
  page: StorybookPage;
  index: number;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });
  const style =
    isDragging
      ? undefined
      : { transform: CSS.Transform.toString(transform), transition };
  const Icon = PAGE_TYPE_ICONS[page.type];
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 border-loft-black shadow-[4px_4px_0px_#000] p-4 hover:shadow-[6px_6px_0px_#000] transition-all ${isDragging ? 'opacity-0' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
          <Icon className="h-5 w-5 text-loft-black" />
          <span className="text-xs font-bold uppercase text-gray-600">
            {PAGE_TYPE_LABELS[page.type]}
          </span>
        </div>
        <button
          onClick={() => onDelete(page.id)}
          className="p-1 hover:bg-red-100 rounded"
        >
          <TrashIcon className="h-4 w-4 text-red-600" />
        </button>
      </div>
      {(page.imageUrl || (page.type === 'video' && (page.posterUrl || page.videoUrl))) && (
        page.type === 'video' && (page.posterUrl || page.videoUrl) ? (
          page.posterUrl ? (
            <img
              src={page.posterUrl}
              alt={page.title || 'Video'}
              className="w-full h-32 object-cover mb-3 border border-gray-300"
            />
          ) : (
            <video
              src={page.videoUrl}
              preload="metadata"
              muted
              playsInline
              className="w-full h-32 object-cover mb-3 border border-gray-300"
            />
          )
        ) : (
          <img
            src={page.imageUrl}
            alt={page.title || 'Page'}
            className="w-full h-32 object-cover mb-3 border border-gray-300"
          />
        )
      )}
      <h3 className="font-bold mb-1 truncate">{page.title || 'Untitled'}</h3>
      {page.content && (
        <p className="text-sm text-gray-600 line-clamp-3">{page.content}</p>
      )}
      {page.url && (
        <p className="text-xs text-blue-600 truncate">{page.url}</p>
      )}
      {page.quote && (
        <p className="text-xs italic text-loft-yellow mt-1 truncate">
          &quot;{page.quote}&quot;
        </p>
      )}
      {page.voiceClips && page.voiceClips.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <SpeakerWaveIcon className="h-3 w-3" />
          {page.voiceClips.length} voice clip(s)
        </div>
      )}
    </div>
  );
}

export function StorybookDetail({ storybookId }: StorybookDetailProps) {
  const router = useRouter();
  const dialog = useDialog();
  const [storybook, setStorybook] = useState<Storybook | null>(null);
  const [pages, setPages] = useState<StorybookPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [addMediaType, setAddMediaType] = useState<'image' | 'video' | null>(null);
  const [isImportingFolder, setIsImportingFolder] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStorybookData();
  }, [storybookId]);

  const loadStorybookData = async () => {
    try {
      const book = await getStorybookById(storybookId);
      if (!book) {
        await dialog.alert('Storybook not found');
        router.push('/');
        return;
      }
      setStorybook(book);
      setEditedTitle(book.title);
      setEditedDescription(book.description || '');

      const bookPages = await getPagesByStorybookId(storybookId);
      setPages(bookPages);
    } catch (err) {
      console.error('Failed to load storybook:', err);
      await dialog.alert('Failed to load storybook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!storybook || !editedTitle.trim()) return;
    
    const updated: Storybook = {
      ...storybook,
      title: editedTitle.trim(),
      description: editedDescription.trim() || undefined,
      updatedAt: Date.now(),
    };

    try {
      await saveStorybook(updated);
      setStorybook(updated);
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Failed to update storybook:', err);
      await dialog.alert('Failed to update storybook');
    }
  };

  const handleDeleteStorybook = async () => {
    const ok = await dialog.confirm('Delete this storybook and all its pages?', {
      confirmLabel: 'DELETE',
      cancelLabel: 'CANCEL',
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteStorybook(storybookId);
      router.push('/');
    } catch (err) {
      console.error('Failed to delete storybook:', err);
      await dialog.alert('Failed to delete storybook');
    }
  };

  const handleAddPage = (type: StorybookPage['type']) => {
    if (type === 'audio-image') {
      router.push(`/create?storybookId=${storybookId}`);
    } else if (type === 'image' || type === 'video') {
      setAddMediaType(type);
    } else {
      createSimplePage(type);
    }
  };

  const handleFolderChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!storybook || !files?.length) {
        e.target.value = '';
        return;
      }
      setIsImportingFolder(true);
      const fileList = Array.from(files).sort((a, b) =>
        (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name)
      );

      const readFile = (file: File): Promise<{ type: 'image' | 'video' | 'text'; title: string; urlOrDataUrl?: string; content?: string } | null> => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const title = file.name.replace(/\.[^.]+$/, '') || file.name;
        if (FOLDER_IMAGE_EXTS.has(ext)) {
          return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve({ type: 'image', title, urlOrDataUrl: r.result as string });
            r.onerror = () => reject(r.error);
            r.readAsDataURL(file);
          });
        }
        if (FOLDER_VIDEO_EXTS.has(ext)) {
          return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve({ type: 'video', title, urlOrDataUrl: r.result as string });
            r.onerror = () => reject(r.error);
            r.readAsDataURL(file);
          });
        }
        if (FOLDER_TEXT_EXTS.has(ext)) {
          return file.text().then((content) => ({ type: 'text', title, content }));
        }
        return Promise.resolve(null);
      };

      try {
        const results = await Promise.all(fileList.map(readFile));
        const items = results.filter((r): r is NonNullable<typeof r> => r != null);
        if (items.length === 0) {
          await dialog.alert('No supported files found (image: jpg/png/gif/webp…; video: mp4/webm/mov…; text: txt/md).');
          return;
        }
        const newPages: StorybookPage[] = await Promise.all(
          items.map(async (item, i) => {
            const posterUrl =
              item.type === 'video' && item.urlOrDataUrl
                ? await getVideoPosterUrl(item.urlOrDataUrl).catch(() => undefined)
                : undefined;
            return {
              id: `page-${Date.now()}-${i}`,
              storybookId,
              order: pages.length + i,
              type: item.type,
              timestamp: Date.now(),
              title: item.title,
              imageUrl: item.type === 'image' ? item.urlOrDataUrl : undefined,
              videoUrl: item.type === 'video' ? item.urlOrDataUrl : undefined,
              content: item.type === 'text' ? item.content : undefined,
              posterUrl,
            };
          })
        );
        for (const p of newPages) await savePage(p);
        const updatedStorybook: Storybook = {
          ...storybook,
          pageIds: [...storybook.pageIds, ...newPages.map((p) => p.id)],
          updatedAt: Date.now(),
        };
        await saveStorybook(updatedStorybook);
        setPages((prev) => [...prev, ...newPages]);
        setStorybook(updatedStorybook);
      } catch (err) {
        console.error('Failed to import folder:', err);
        await dialog.alert('Failed to import folder.');
      } finally {
        setIsImportingFolder(false);
        e.target.value = '';
      }
    },
    [storybook, storybookId, pages, dialog]
  );

  const triggerFolderSelect = useCallback(() => {
    if (isImportingFolder) return;
    folderInputRef.current?.click();
  }, [isImportingFolder]);

  const handleAddMediaConfirm = async (items: AddMediaItem[]) => {
    if (!storybook || !addMediaType || items.length === 0) return;
    setAddMediaType(null);

    const newPages: StorybookPage[] = await Promise.all(
      items.map(async (item, i) => {
        const posterUrl =
          addMediaType === 'video'
            ? await getVideoPosterUrl(item.urlOrDataUrl).catch(() => undefined)
            : undefined;
        return {
          id: `page-${Date.now()}-${i}`,
          storybookId,
          order: pages.length + i,
          type: addMediaType,
          timestamp: Date.now(),
          title: item.title,
          imageUrl: addMediaType === 'image' ? item.urlOrDataUrl : undefined,
          videoUrl: addMediaType === 'video' ? item.urlOrDataUrl : undefined,
          posterUrl,
        };
      })
    );

    try {
      for (const p of newPages) await savePage(p);
      const updatedStorybook: Storybook = {
        ...storybook,
        pageIds: [...storybook.pageIds, ...newPages.map((p) => p.id)],
        updatedAt: Date.now(),
      };
      await saveStorybook(updatedStorybook);
      setPages([...pages, ...newPages]);
      setStorybook(updatedStorybook);
    } catch (err) {
      console.error('Failed to create page(s):', err);
      await dialog.alert('Failed to create page(s)');
    }
  };

  const createSimplePage = async (type: StorybookPage['type']) => {
    if (!storybook) return;

    let title = '';
    let content = '';
    let url = '';

    if (type === 'text') {
      const values = await dialog.prompt('Add Text Page', [
        { label: 'Page Title', defaultValue: 'Untitled' },
        { label: 'Content', placeholder: 'Enter text content', multiline: true },
      ]);
      if (!values) return;
      title = values[0]?.trim() || 'Untitled';
      content = values[1] ?? '';
    } else if (type === 'webpage') {
      const values = await dialog.prompt('Add Webpage', [
        { label: 'Page Title', defaultValue: 'Webpage' },
        { label: 'URL', placeholder: 'Enter URL' },
      ]);
      if (!values || !values[1]?.trim()) return;
      title = values[0]?.trim() || 'Webpage';
      url = values[1].trim();
    }

    const newPage: StorybookPage = {
      id: `page-${Date.now()}`,
      storybookId,
      order: pages.length,
      type,
      timestamp: Date.now(),
      title,
      content: type === 'text' ? content : undefined,
      url: type === 'webpage' ? url : undefined,
    };

    try {
      await savePage(newPage);
      
      // Update storybook pageIds
      const updatedStorybook: Storybook = {
        ...storybook,
        pageIds: [...storybook.pageIds, newPage.id],
        updatedAt: Date.now(),
      };
      await saveStorybook(updatedStorybook);
      
      setPages([...pages, newPage]);
      setStorybook(updatedStorybook);
    } catch (err) {
      console.error('Failed to create page:', err);
      await dialog.alert('Failed to create page');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!storybook) return;
    const ok = await dialog.confirm('Delete this page?', {
      confirmLabel: 'DELETE',
      cancelLabel: 'CANCEL',
      danger: true,
    });
    if (!ok) return;

    try {
      await deletePage(pageId);
      
      // Update storybook pageIds
      const updatedStorybook: Storybook = {
        ...storybook,
        pageIds: storybook.pageIds.filter((id) => id !== pageId),
        updatedAt: Date.now(),
      };
      await saveStorybook(updatedStorybook);
      
      setPages(pages.filter((p) => p.id !== pageId));
      setStorybook(updatedStorybook);
    } catch (err) {
      console.error('Failed to delete page:', err);
      await dialog.alert('Failed to delete page');
    }
  };

  const handlePlayCinema = () => {
    router.push(`/storybooks/${storybookId}/cinema`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!storybook || !over || active.id === over.id) return;
    const from = pages.findIndex((p) => p.id === active.id);
    const to = pages.findIndex((p) => p.id === over.id);
    if (from === -1 || to === -1) return;
    const next = [...pages];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    const reorderedPageIds = next.map((p) => p.id);
    setPages(next);
    const updatedStorybook: Storybook = {
      ...storybook,
      pageIds: reorderedPageIds,
      updatedAt: Date.now(),
    };
    setStorybook(updatedStorybook);
    try {
      await saveStorybook(updatedStorybook);
    } catch (err) {
      console.error('Failed to save order:', err);
      await dialog.alert('Failed to save order');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-loft-black bg-loft-gray">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-loft-black text-2xl">Loading...</p>
        </main>
      </div>
    );
  }

  if (!storybook) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-loft-black bg-loft-gray">
      <Header />

      <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="mb-8 flex items-start justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-loft-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            BACK
          </button>

          <div className="flex gap-4">
            <button
              onClick={handlePlayCinema}
              className="flex items-center gap-2 px-6 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold"
            >
              <PlayIcon className="h-5 w-5" />
              CINEMA MODE
            </button>
            <button
              onClick={handleDeleteStorybook}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white border-2 border-loft-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold"
            >
              <TrashIcon className="h-5 w-5" />
              DELETE
            </button>
          </div>
        </div>

        {/* Storybook Info */}
        <div className="bg-white border-2 border-loft-black shadow-[8px_8px_0px_#000] p-6 mb-8">
          {isEditingTitle ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-3xl font-black uppercase tracking-wide border-2 border-loft-black px-4 py-2"
                placeholder="Storybook Title"
              />
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full border-2 border-loft-black px-4 py-2 resize-none"
                rows={3}
                placeholder="Description (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTitle}
                  className="px-4 py-2 bg-loft-yellow text-loft-black border-2 border-loft-black font-bold hover:bg-yellow-400"
                >
                  SAVE
                </button>
                <button
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditedTitle(storybook.title);
                    setEditedDescription(storybook.description || '');
                  }}
                  className="px-4 py-2 bg-gray-300 text-loft-black border-2 border-loft-black font-bold hover:bg-gray-400"
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-black uppercase tracking-wide">
                  {storybook.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
              {storybook.description && (
                <p className="text-gray-600">{storybook.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2 font-mono">
                Updated: {new Date(storybook.updatedAt).toLocaleString()}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-bold uppercase tracking-wide text-loft-black">
                  Background music:{' '}
                </span>
                <span className="text-sm text-gray-600">
                  {storybook.backgroundMusicName || 'None'}
                </span>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 text-xs bg-loft-gray text-gray-400 border-2 border-gray-300 font-bold cursor-not-allowed"
                    title="Coming soon"
                  >
                    UPLOAD
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 text-xs bg-loft-gray text-gray-400 border-2 border-gray-300 font-bold cursor-not-allowed"
                    title="Coming soon"
                  >
                    AI GENERATE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Page Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 uppercase">Add Page</h2>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            onChange={handleFolderChange}
            className="hidden"
            aria-hidden
            {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
          />
          <div className="flex gap-3 flex-wrap">
            {(['text', 'webpage', 'image', 'audio-image', 'video'] as const).map((type) => {
              const Icon = PAGE_TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => handleAddPage(type)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-loft-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold text-sm"
                >
                  <Icon className="h-5 w-5" />
                  {PAGE_TYPE_LABELS[type]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={triggerFolderSelect}
              disabled={isImportingFolder}
              className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-loft-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold text-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              <FolderIcon className="h-5 w-5" />
              {isImportingFolder ? 'IMPORTING…' : 'IMPORT FOLDER'}
            </button>
          </div>
        </div>

        {/* Pages List */}
        <div>
          <h2 className="text-xl font-bold mb-4 uppercase">
            Pages ({pages.length})
          </h2>
          {pages.length === 0 ? (
            <div className="bg-white border-2 border-loft-black p-8 text-center text-gray-500">
              No pages yet. Add your first page above.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pages.map((page, index) => (
                    <SortablePageCard
                      key={page.id}
                      page={page}
                      index={index}
                      onDelete={handleDeletePage}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeId ? (() => {
                  const page = pages.find((p) => p.id === activeId);
                  const index = page ? pages.findIndex((p) => p.id === activeId) : 0;
                  if (!page) return null;
                  const Icon = PAGE_TYPE_ICONS[page.type];
                  return (
                    <div className="bg-white border-2 border-loft-black shadow-[8px_8px_0px_#000] p-4 cursor-grabbing">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
                          <Icon className="h-5 w-5 text-loft-black" />
                          <span className="text-xs font-bold uppercase text-gray-600">
                            {PAGE_TYPE_LABELS[page.type]}
                          </span>
                        </div>
                      </div>
                      {(page.imageUrl || (page.type === 'video' && (page.posterUrl || page.videoUrl))) && (
                        page.type === 'video' && (page.posterUrl || page.videoUrl) ? (
                          page.posterUrl ? (
                            <img src={page.posterUrl} alt="" className="w-full h-32 object-cover mb-3 border border-gray-300" />
                          ) : (
                            <video src={page.videoUrl} preload="metadata" muted playsInline className="w-full h-32 object-cover mb-3 border border-gray-300" />
                          )
                        ) : (
                          <img src={page.imageUrl} alt="" className="w-full h-32 object-cover mb-3 border border-gray-300" />
                        )
                      )}
                      <h3 className="font-bold mb-1 truncate">{page.title || 'Untitled'}</h3>
                      {page.content && (
                        <p className="text-sm text-gray-600 line-clamp-3">{page.content}</p>
                      )}
                      {page.url && (
                        <p className="text-xs text-blue-600 truncate">{page.url}</p>
                      )}
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </main>

      {addMediaType && (
        <AddMediaPageModal
          open={!!addMediaType}
          onClose={() => setAddMediaType(null)}
          type={addMediaType}
          onConfirm={handleAddMediaConfirm}
        />
      )}
    </div>
  );
}
