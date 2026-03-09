import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import ImageUploader from '../components/ImageUploader';
import ImageGrid from '../components/ImageGrid';

export default function CreativeLibrary() {
  const { api } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/meta/accounts').then(res => {
      const accts = res.data.data || [];
      setAccounts(accts);
      if (accts.length > 0) setSelectedAccount(accts[0].account_id);
    }).catch(err => console.error('Failed to load accounts:', err));
  }, [api]);

  const loadImages = useCallback(() => {
    if (!selectedAccount) return;
    setLoading(true);
    api.get(`/meta/accounts/${selectedAccount}/images`)
      .then(res => setImages(res.data.data || []))
      .catch(err => console.error('Failed to load images:', err))
      .finally(() => setLoading(false));
  }, [selectedAccount, api]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const handleDelete = async (hash) => {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    setDeleting(hash);
    try {
      await api.delete(`/meta/accounts/${selectedAccount}/images/${hash}`);
      loadImages();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Library</h1>
          <p className="text-gray-500 mt-1">Upload and manage your ad images</p>
        </div>
        <div>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {accounts.map(a => (
              <option key={a.account_id} value={a.account_id}>{a.name} ({a.account_id})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Images</h2>
        <ImageUploader accountId={selectedAccount} api={api} onUploadComplete={loadImages} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Image Library ({images.length})</h2>
          <button onClick={loadImages} className="text-sm text-blue-600 hover:text-blue-700">
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ImageGrid images={images} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
