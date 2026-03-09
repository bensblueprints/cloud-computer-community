import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import TemplateForm from '../components/TemplateForm';
import AdPreviewCard from '../components/AdPreviewCard';

export default function Templates() {
  const { api } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null); // null = list, 'new' = create, template obj = edit
  const [loading, setLoading] = useState(true);

  const loadTemplates = () => {
    api.get('/templates')
      .then(res => setTemplates(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Failed to load templates:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
    api.get('/meta/pages')
      .then(res => setPages(res.data.data || []))
      .catch(() => {});
  }, [api]);

  const handleSave = async (form) => {
    try {
      if (editing && editing !== 'new') {
        await api.put(`/templates/${editing.id}`, form);
      } else {
        await api.post('/templates', form);
      }
      setEditing(null);
      loadTemplates();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      loadTemplates();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  const getPageName = (pageId) => {
    const page = pages.find(p => p.id === pageId);
    return page?.name || 'Your Page';
  };

  if (editing) {
    const tpl = editing === 'new' ? null : editing;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{tpl ? 'Edit Template' : 'New Template'}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <TemplateForm
              template={tpl}
              pages={pages}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Preview</h3>
            <AdPreviewCard
              pageName={getPageName(tpl?.page_id || '')}
              bodyText={tpl?.body_text || 'Your ad copy will appear here...'}
              headline={tpl?.headline || 'Your Headline'}
              description={tpl?.description}
              linkUrl={tpl?.link_url || 'https://example.com'}
              ctaType={tpl?.cta_type || 'LEARN_MORE'}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500 mt-1">Save reusable ad copy for Quick Launch</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-3 text-gray-500">No templates yet. Create one to save your ad copy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{tpl.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(tpl)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {tpl.headline && <p className="text-sm font-medium text-gray-700">{tpl.headline}</p>}
              {tpl.body_text && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tpl.body_text}</p>}
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{(tpl.cta_type || 'LEARN_MORE').replace(/_/g, ' ')}</span>
                {tpl.page_id && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Page: {getPageName(tpl.page_id)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
