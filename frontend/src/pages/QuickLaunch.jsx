import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ImageGrid from '../components/ImageGrid';
import AdPreviewCard from '../components/AdPreviewCard';

const STEPS = ['Select Template', 'Choose Images', 'Configure', 'Review & Launch'];

export default function QuickLaunch() {
  const { api } = useAuth();
  const [step, setStep] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedHashes, setSelectedHashes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [pages, setPages] = useState([]);
  const [config, setConfig] = useState({
    campaign_id: '',
    adset_name: '',
    daily_budget: '2000',
    targeting_type: 'broad',
    countries: 'US',
  });
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState(null);

  // Load initial data
  useEffect(() => {
    Promise.all([
      api.get('/meta/accounts'),
      api.get('/templates'),
      api.get('/meta/pages'),
    ]).then(([acctRes, tplRes, pagesRes]) => {
      const accts = acctRes.data.data || [];
      setAccounts(accts);
      if (accts.length > 0) setSelectedAccount(accts[0].account_id);
      setTemplates(Array.isArray(tplRes.data) ? tplRes.data : []);
      setPages(pagesRes.data.data || []);
    }).catch(err => console.error('Failed to load data:', err));
  }, [api]);

  // Load images and campaigns when account changes
  useEffect(() => {
    if (!selectedAccount) return;
    api.get(`/meta/accounts/${selectedAccount}/images`)
      .then(res => setImages(res.data.data || []))
      .catch(() => {});
    api.get(`/meta/accounts/${selectedAccount}/campaigns`)
      .then(res => setCampaigns(res.data.data || []))
      .catch(() => {});
  }, [selectedAccount, api]);

  const toggleHash = (hash) => {
    setSelectedHashes(prev =>
      prev.includes(hash) ? prev.filter(h => h !== hash) : [...prev, hash]
    );
  };

  const getPageName = (pageId) => pages.find(p => p.id === pageId)?.name || 'Your Page';

  const handleLaunch = async () => {
    if (!selectedTemplate || selectedHashes.length === 0 || !config.campaign_id) {
      alert('Please complete all steps before launching.');
      return;
    }

    setLaunching(true);
    setResult(null);

    try {
      const targeting = config.targeting_type === 'broad'
        ? { geo_locations: { countries: config.countries.split(',').map(c => c.trim()) } }
        : { geo_locations: { countries: config.countries.split(',').map(c => c.trim()) } };

      // 1. Create ad set
      const adsetRes = await api.post(`/meta/accounts/${selectedAccount}/adsets`, {
        name: config.adset_name || `QuickLaunch AdSet ${Date.now()}`,
        campaign_id: config.campaign_id,
        status: 'PAUSED',
        daily_budget: config.daily_budget,
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'LINK_CLICKS',
        targeting,
      });
      const adset_id = adsetRes.data.id;

      // 2. Create creatives and ads for each image
      const results = [];
      for (const hash of selectedHashes) {
        // Create creative
        const creativeRes = await api.post(`/meta/accounts/${selectedAccount}/creatives`, {
          name: `${selectedTemplate.name} - ${hash.substring(0, 8)}`,
          page_id: selectedTemplate.page_id,
          image_hash: hash,
          message: selectedTemplate.body_text,
          headline: selectedTemplate.headline,
          description: selectedTemplate.description,
          link_url: selectedTemplate.link_url,
          cta_type: selectedTemplate.cta_type,
        });

        // Create ad
        const adRes = await api.post(`/meta/accounts/${selectedAccount}/ads`, {
          name: `${selectedTemplate.name} - Ad ${hash.substring(0, 8)}`,
          adset_id,
          creative_id: creativeRes.data.id,
          status: 'PAUSED',
        });

        results.push({ hash, creative_id: creativeRes.data.id, ad_id: adRes.data.id });
      }

      setResult({
        success: true,
        adset_id,
        ads_created: results.length,
        results,
      });
    } catch (err) {
      setResult({
        success: false,
        error: err.response?.data?.error || err.message,
      });
    } finally {
      setLaunching(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedTemplate;
      case 1: return selectedHashes.length > 0;
      case 2: return !!config.campaign_id;
      case 3: return true;
      default: return false;
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`bg-white rounded-xl border-2 p-8 text-center ${result.success ? 'border-green-200' : 'border-red-200'}`}>
          {result.success ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ads Created Successfully!</h2>
              <p className="text-gray-500 mb-4">
                Created 1 ad set + {result.ads_created} ad{result.ads_created !== 1 ? 's' : ''}, all PAUSED.
              </p>
              <p className="text-sm text-gray-400 mb-6">Ad Set ID: {result.adset_id}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Launch Failed</h2>
              <p className="text-red-600 mb-4">{result.error}</p>
            </>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setResult(null); setStep(0); setSelectedHashes([]); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Launch Another
            </button>
            <a href="/dashboard/ads" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              View Ads
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Launch</h1>
          <p className="text-gray-500 mt-1">Deploy image ads with the same copy across different images</p>
        </div>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          {accounts.map(a => (
            <option key={a.account_id} value={a.account_id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-4">
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={`flex-1 h-0.5 ${i <= step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                i === step
                  ? 'bg-blue-100 text-blue-700'
                  : i < step
                  ? 'bg-green-100 text-green-700 cursor-pointer'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Step 1: Select Template */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select a Template</h2>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No templates yet.</p>
                <a href="/dashboard/templates" className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block">
                  Create a template first
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate?.id === tpl.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{tpl.name}</h3>
                    {tpl.headline && <p className="text-sm text-gray-700 mt-1">{tpl.headline}</p>}
                    {tpl.body_text && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tpl.body_text}</p>}
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {(tpl.cta_type || 'LEARN_MORE').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Images */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Choose Images</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select 1 or more images. Each image will become a separate ad with the same copy.
              {selectedHashes.length > 0 && (
                <span className="text-blue-600 font-medium ml-2">{selectedHashes.length} selected</span>
              )}
            </p>
            <ImageGrid
              images={images}
              selectedHashes={selectedHashes}
              onToggleSelect={toggleHash}
              selectable
            />
          </div>
        )}

        {/* Step 3: Configure */}
        {step === 2 && (
          <div className="max-w-xl space-y-4">
            <h2 className="text-lg font-semibold mb-4">Configure Ad Set</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
              <select
                value={config.campaign_id}
                onChange={(e) => setConfig(prev => ({ ...prev, campaign_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a campaign...</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Set Name</label>
              <input
                type="text"
                value={config.adset_name}
                onChange={(e) => setConfig(prev => ({ ...prev, adset_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Summer Sale - Broad US"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget (cents)</label>
              <input
                type="number"
                value={config.daily_budget}
                onChange={(e) => setConfig(prev => ({ ...prev, daily_budget: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="2000 = $20.00/day"
              />
              <p className="text-xs text-gray-500 mt-1">{(parseInt(config.daily_budget) / 100).toFixed(2)} USD/day</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Targeting</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="broad"
                    checked={config.targeting_type === 'broad'}
                    onChange={() => setConfig(prev => ({ ...prev, targeting_type: 'broad' }))}
                  />
                  <span className="text-sm">Broad (Advantage+)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="custom"
                    checked={config.targeting_type === 'custom'}
                    onChange={() => setConfig(prev => ({ ...prev, targeting_type: 'custom' }))}
                  />
                  <span className="text-sm">Custom Audience</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Countries (comma-separated)</label>
              <input
                type="text"
                value={config.countries}
                onChange={(e) => setConfig(prev => ({ ...prev, countries: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="US, CA, GB"
              />
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Review & Launch</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Template</h3>
                  <p className="font-semibold">{selectedTemplate?.name}</p>
                  {selectedTemplate?.headline && <p className="text-sm text-gray-600">{selectedTemplate.headline}</p>}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Images</h3>
                  <p className="font-semibold">{selectedHashes.length} image{selectedHashes.length !== 1 ? 's' : ''} selected</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedHashes.map(hash => {
                      const img = images.find(i => i.hash === hash);
                      return img ? (
                        <div key={hash} className="w-12 h-12 rounded bg-gray-200 overflow-hidden">
                          <img src={img.url_128 || img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Ad Set Config</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Campaign:</span> {campaigns.find(c => c.id === config.campaign_id)?.name}</p>
                    <p><span className="text-gray-500">Name:</span> {config.adset_name || 'Auto-generated'}</p>
                    <p><span className="text-gray-500">Budget:</span> ${(parseInt(config.daily_budget) / 100).toFixed(2)}/day</p>
                    <p><span className="text-gray-500">Targeting:</span> {config.targeting_type} ({config.countries})</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-700 mb-1">Will Create:</h3>
                  <ul className="text-sm text-blue-600 space-y-0.5">
                    <li>1 Ad Set (PAUSED)</li>
                    <li>{selectedHashes.length} Creative{selectedHashes.length !== 1 ? 's' : ''}</li>
                    <li>{selectedHashes.length} Ad{selectedHashes.length !== 1 ? 's' : ''} (PAUSED)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Ad Preview</h3>
                <AdPreviewCard
                  pageName={getPageName(selectedTemplate?.page_id)}
                  bodyText={selectedTemplate?.body_text}
                  imageUrl={(() => {
                    const img = images.find(i => i.hash === selectedHashes[0]);
                    return img?.url_128 || img?.url;
                  })()}
                  headline={selectedTemplate?.headline}
                  description={selectedTemplate?.description}
                  linkUrl={selectedTemplate?.link_url}
                  ctaType={selectedTemplate?.cta_type}
                />
                {selectedHashes.length > 1 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    + {selectedHashes.length - 1} more variation{selectedHashes.length - 1 !== 1 ? 's' : ''} with different images
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className={`px-4 py-2 rounded-lg font-medium ${
            step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Back
        </button>
        <div className="flex gap-3">
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className={`px-6 py-2 rounded-lg font-medium ${
                canNext()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {launching ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Launching...
                </span>
              ) : (
                'Launch Ads'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
