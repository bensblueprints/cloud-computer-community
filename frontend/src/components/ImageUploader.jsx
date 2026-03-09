import React, { useState, useRef, useCallback } from 'react';

export default function ImageUploader({ accountId, api, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    if (!accountId || files.length === 0) return;
    setUploading(true);
    const items = Array.from(files).map(f => ({ name: f.name, status: 'pending' }));
    setProgress(items);

    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    try {
      const res = await api.post(`/meta/accounts/${accountId}/images/batch`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const results = res.data.results || [];
      setProgress(results.map(r => ({
        name: r.filename,
        status: r.success ? 'done' : 'error',
        error: r.error
      })));
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setProgress(items.map(i => ({ ...i, status: 'error', error: err.message })));
    } finally {
      setUploading(false);
      setTimeout(() => setProgress([]), 3000);
    }
  }, [accountId, api, onUploadComplete]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          {uploading ? 'Uploading...' : 'Drag & drop images here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
      </div>

      {progress.length > 0 && (
        <div className="mt-3 space-y-1">
          {progress.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm px-3 py-1.5 bg-gray-50 rounded">
              <span className="truncate">{item.name}</span>
              <span className={item.status === 'done' ? 'text-green-600' : item.status === 'error' ? 'text-red-600' : 'text-gray-400'}>
                {item.status === 'done' ? 'Uploaded' : item.status === 'error' ? item.error || 'Failed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
