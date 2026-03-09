import React, { useState, useEffect } from 'react';

const CTA_OPTIONS = [
  'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'DOWNLOAD', 'BOOK_TRAVEL',
  'CONTACT_US', 'GET_OFFER', 'GET_QUOTE', 'SUBSCRIBE', 'APPLY_NOW',
  'WATCH_MORE', 'ORDER_NOW'
];

export default function TemplateForm({ template, pages, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    headline: '',
    body_text: '',
    description: '',
    link_url: '',
    cta_type: 'LEARN_MORE',
    page_id: '',
  });

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        headline: template.headline || '',
        body_text: template.body_text || '',
        description: template.description || '',
        link_url: template.link_url || '',
        cta_type: template.cta_type || 'LEARN_MORE',
        page_id: template.page_id || '',
      });
    }
  }, [template]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
        <input
          type="text"
          value={form.name}
          onChange={set('name')}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Summer Sale Template"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
        <input
          type="text"
          value={form.headline}
          onChange={set('headline')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 50% Off Everything"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
        <textarea
          value={form.body_text}
          onChange={set('body_text')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Main ad copy that appears above the image..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={set('description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Short description below headline"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
        <input
          type="url"
          value={form.link_url}
          onChange={set('link_url')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/landing-page"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button</label>
          <select
            value={form.cta_type}
            onChange={set('cta_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CTA_OPTIONS.map(cta => (
              <option key={cta} value={cta}>{cta.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page</label>
          <select
            value={form.page_id}
            onChange={set('page_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a page...</option>
            {(pages || []).map(page => (
              <option key={page.id} value={page.id}>{page.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {template ? 'Update Template' : 'Create Template'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
