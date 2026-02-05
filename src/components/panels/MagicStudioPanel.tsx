'use client';

import { useState } from 'react';
import {
  SparklesIcon,
  PhotoIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCinematicStore } from '@/lib/store/cinematic-store';

export function MagicStudioPanel({
  isProcessing,
  onTextEdit,
}: {
  isProcessing: boolean;
  onTextEdit: () => void;
}) {
  const blendImage = useCinematicStore((s) => s.blendImage);
  const setBlendImage = useCinematicStore((s) => s.setBlendImage);
  const textEditInstruction = useCinematicStore((s) => s.textEditInstruction);
  const setTextEditInstruction = useCinematicStore((s) => s.setTextEditInstruction);
  const currentImage = useCinematicStore((s) => s.currentImage);
  const dynamicProperties = useCinematicStore((s) => s.dynamicProperties);
  const isAnalyzingPrompt = useCinematicStore((s) => s.isAnalyzingPrompt);
  const setDynamicProperties = useCinematicStore((s) => s.setDynamicProperties);
  const updateDynamicProperty = useCinematicStore((s) => s.updateDynamicProperty);
  const togglePropertyActive = useCinematicStore((s) => s.togglePropertyActive);
  const setIsAnalyzingPrompt = useCinematicStore((s) => s.setIsAnalyzingPrompt);

  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleBlendUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlendImage(reader.result as string);
        if (!textEditInstruction) {
          setTextEditInstruction(
            'Seamlessly integrate elements from the uploaded image into the main scene. Ensure perspective and lighting match.'
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIGenerate = async () => {
    if (!textEditInstruction.trim() || !currentImage) {
      return;
    }

    try {
      setIsAnalyzingPrompt(true);

      const response = await fetch('/api/cinematic/edit/analyze-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: textEditInstruction,
          originalImageBase64: currentImage,
          blendImageBase64: blendImage || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze prompt');
      }

      const data = await response.json();
      setTextEditInstruction(data.optimizedPrompt);
      setDynamicProperties(data.properties);
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('Failed to generate AI recommendations. Please try again.');
    } finally {
      setIsAnalyzingPrompt(false);
    }
  };

  const startEditProperty = (id: string, currentValue: string) => {
    setEditingPropertyId(id);
    setEditingValue(currentValue);
  };

  const savePropertyEdit = (id: string) => {
    if (editingValue.trim()) {
      const property = dynamicProperties.find((p) => p.id === id);
      if (property) {
        // Update the property value
        updateDynamicProperty(id, { value: editingValue.trim() });

        // Rebuild the prompt with updated property values
        rebuildPromptFromProperties(id, editingValue.trim());
      }
    }
    setEditingPropertyId(null);
    setEditingValue('');
  };

  const cancelPropertyEdit = () => {
    setEditingPropertyId(null);
    setEditingValue('');
  };

  const rebuildPromptFromProperties = (changedId: string, newValue: string) => {
    // Get all active properties
    const activeProps = dynamicProperties.map((prop) =>
      prop.id === changedId ? { ...prop, value: newValue } : prop
    ).filter((p) => p.isActive);

    if (activeProps.length === 0) return;

    // Build a comprehensive prompt from all active properties
    const propertyDescriptions = activeProps.map((p) => `${p.name}: ${p.value}`).join(', ');
    
    // Create a coherent prompt that incorporates all properties
    const newPrompt = `Edit the image with the following specifications: ${propertyDescriptions}. Maintain the original composition while applying these changes seamlessly.`;
    
    setTextEditInstruction(newPrompt);
  };

  // Group properties by category
  const groupedProperties: Record<string, typeof dynamicProperties> = {};
  dynamicProperties.forEach((prop) => {
    if (!groupedProperties[prop.category]) {
      groupedProperties[prop.category] = [];
    }
    groupedProperties[prop.category].push(prop);
  });

  return (
    <div
      className={`bg-loft-yellow border-4 border-loft-black p-5 relative shadow-loft ${
        isProcessing || isAnalyzingPrompt ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="absolute -top-4 -right-4 bg-black text-white text-xs font-black px-3 py-1 -rotate-2 border-2 border-white shadow-sm">
        NANO PRO TOOLS
      </div>

      <h3 className="font-black text-xl mb-4 flex items-center gap-2 text-black">
        <SparklesIcon className="h-6 w-6" />
        MAGIC STUDIO
      </h3>

      <div className="mb-4 bg-white/50 border-2 border-dashed border-black p-2 relative text-center hover:bg-white transition-colors">
        {blendImage ? (
          <div className="relative">
            <img
              src={blendImage}
              alt="Blend"
              className="h-20 mx-auto object-cover border border-black"
            />
            <button
              onClick={() => {
                setBlendImage(null);
                setTextEditInstruction('');
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full border border-black hover:bg-red-600"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-2 cursor-pointer">
            <PhotoIcon className="h-6 w-6 text-black opacity-50" />
            <span className="text-[10px] font-bold text-black uppercase mt-1">
              Blend Image
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBlendUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="relative mb-4">
        <textarea
          value={textEditInstruction}
          onChange={(e) => setTextEditInstruction(e.target.value)}
          placeholder={
            blendImage
              ? 'Describe how to blend this image...'
              : "Describe the change (e.g. 'Add a cat', 'Make it cyberpunk')..."
          }
          className="w-full h-32 border-2 border-black p-3 text-xs font-medium outline-none resize-none focus:bg-white bg-white/80 transition-colors"
        />
        <button
          type="button"
          onClick={handleAIGenerate}
          disabled={!textEditInstruction.trim() || isAnalyzingPrompt}
          title={isAnalyzingPrompt ? 'Analyzing...' : 'AI Generate'}
          className="absolute bottom-2 right-1 w-8 h-8 flex items-center justify-center bg-loft-yellow text-black border-2 border-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzingPrompt ? (
            <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <SparklesIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Dynamic Properties */}
      {Object.keys(groupedProperties).length > 0 && (
        <div className="space-y-3 mb-4">
          {Object.entries(groupedProperties).map(([category, properties]) => (
            <div key={category} className="bg-white border-2 border-black p-2">
              <p className="text-[10px] font-black text-gray-400 mb-2 tracking-wider uppercase">
                {category}
              </p>
              <div className="space-y-2">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className={`flex items-center gap-2 p-2 border ${
                      prop.isActive
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 bg-gray-100 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={prop.isActive}
                      onChange={() => togglePropertyActive(prop.id)}
                      className="w-3 h-3 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-gray-600 uppercase">
                        {prop.name}
                      </div>
                      {editingPropertyId === prop.id ? (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePropertyEdit(prop.id);
                              if (e.key === 'Escape') cancelPropertyEdit();
                            }}
                            className="flex-1 text-xs border border-gray-400 px-1 py-0.5 outline-none focus:border-black"
                            autoFocus
                          />
                          <button
                            onClick={() => savePropertyEdit(prop.id)}
                            className="p-0.5 bg-green-500 text-white hover:bg-green-600"
                          >
                            <CheckIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={cancelPropertyEdit}
                            className="p-0.5 bg-red-500 text-white hover:bg-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-black mt-0.5 truncate">
                          {prop.value}
                        </div>
                      )}
                    </div>
                    {editingPropertyId !== prop.id && (
                      <button
                        onClick={() => startEditProperty(prop.id, prop.value)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Edit value"
                      >
                        <PencilIcon className="h-3 w-3 text-gray-600" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Button - Moved to bottom */}
      <button
        onClick={onTextEdit}
        disabled={!textEditInstruction || isProcessing}
        className="w-full bg-black text-white px-6 py-3 text-sm font-bold border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        GENERATE
      </button>
    </div>
  );
}
