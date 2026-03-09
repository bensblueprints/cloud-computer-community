import React from 'react';

export default function ImageGrid({ images, selectedHashes, onToggleSelect, onDelete, selectable = false }) {
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2">No images yet. Upload some to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((img) => {
        const hash = img.hash;
        const isSelected = selectedHashes?.includes(hash);
        return (
          <div
            key={img.id || hash}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => selectable && onToggleSelect?.(hash)}
          >
            <div className="aspect-square bg-gray-100">
              <img
                src={img.url_128 || img.url}
                alt={img.name || 'Ad image'}
                className="w-full h-full object-cover"
              />
            </div>

            {selectable && (
              <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/80 border-gray-300'
              }`}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}

            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(hash); }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
              <p className="text-xs text-white truncate">{img.name || 'Untitled'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
