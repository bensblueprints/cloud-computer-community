import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import AdPreviewCard from '../components/AdPreviewCard';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  DELETED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export default function Ads() {
  const { api } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewAd, setPreviewAd] = useState(null);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    api.get('/meta/accounts').then(res => {
      const accts = res.data.data || [];
      setAccounts(accts);
      if (accts.length > 0) setSelectedAccount(accts[0].account_id);
    }).catch(err => console.error('Failed to load accounts:', err));
  }, [api]);

  const loadAds = () => {
    if (!selectedAccount) return;
    setLoading(true);
    api.get(`/meta/accounts/${selectedAccount}/ads`)
      .then(res => setAds(res.data.data || []))
      .catch(err => console.error('Failed to load ads:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (selectedAccount) loadAds(); }, [selectedAccount]);

  const toggleStatus = async (ad) => {
    const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setToggling(ad.id);
    try {
      await api.post(`/meta/ads/${ad.id}`, { status: newStatus });
      loadAds();
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.error || err.message));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
          <p className="text-gray-500 mt-1">Manage all your Facebook ads</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {accounts.map(a => (
              <option key={a.account_id} value={a.account_id}>{a.name} ({a.account_id})</option>
            ))}
          </select>
          <button onClick={loadAds} className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="mt-3 text-gray-500">No ads yet. Use Quick Launch to create ads rapidly.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ads.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {ad.creative?.thumbnail_url ? (
                          <img src={ad.creative.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{ad.name}</p>
                        <p className="text-xs text-gray-500">ID: {ad.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[ad.status] || 'bg-gray-100 text-gray-600'}`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {ad.created_time ? new Date(ad.created_time).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewAd(ad)}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => toggleStatus(ad)}
                        disabled={toggling === ad.id}
                        className={`px-2 py-1 text-xs rounded ${
                          ad.status === 'ACTIVE'
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {toggling === ad.id ? '...' : ad.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewAd(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Ad Preview: {previewAd.name}</h3>
              <button onClick={() => setPreviewAd(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AdPreviewCard
              pageName={previewAd.creative?.object_story_spec?.page_id || 'Your Page'}
              bodyText={previewAd.creative?.object_story_spec?.link_data?.message}
              imageUrl={previewAd.creative?.image_url || previewAd.creative?.thumbnail_url}
              headline={previewAd.creative?.object_story_spec?.link_data?.name}
              description={previewAd.creative?.object_story_spec?.link_data?.description}
              linkUrl={previewAd.creative?.object_story_spec?.link_data?.link}
              ctaType={previewAd.creative?.object_story_spec?.link_data?.call_to_action?.type}
            />
          </div>
        </div>
      )}
    </div>
  );
}
