import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Package, Upload, Plus, ChevronDown, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

function api(path, opts = {}) {
  return fetch(`${API}/api/admin${path}`, {
    credentials: 'include',
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  }).then(r => r.json());
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [purchases, setPurchases] = useState({});
  const [form, setForm] = useState({ name: '', description: '', price: 500, stripePriceId: '' });

  const load = () => {
    api('/products').then(data => {
      setProducts(data.products || []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const createProduct = async (e) => {
    e.preventDefault();
    await api('/products', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setForm({ name: '', description: '', price: 500, stripePriceId: '' });
    setShowCreate(false);
    load();
  };

  const uploadFile = async (productId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${API}/api/admin/products/${productId}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    load();
  };

  const loadPurchases = async (productId) => {
    if (expanded === productId) {
      setExpanded(null);
      return;
    }
    const data = await api(`/products/${productId}/purchases`);
    setPurchases(prev => ({ ...prev, [productId]: data.purchases || [] }));
    setExpanded(productId);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Products</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createProduct} className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Price (cents)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: parseInt(e.target.value) })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Stripe Price ID</label>
            <input
              value={form.stripePriceId}
              onChange={e => setForm({ ...form, stripePriceId: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="price_..."
            />
          </div>
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Create Product
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-gray-400 text-center py-12">No products yet. Create one above.</div>
      ) : (
        <div className="space-y-4">
          {products.map(p => (
            <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      ${(p.price / 100).toFixed(2)} &middot; {p._count?.purchases || 0} purchases
                      {p.fileName && <span className="ml-2 text-green-400">&#x2713; File uploaded</span>}
                      {!p.fileName && <span className="ml-2 text-yellow-400">No file</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm cursor-pointer">
                      <Upload className="w-4 h-4" /> Upload ZIP
                      <input
                        type="file"
                        accept=".zip"
                        className="hidden"
                        onChange={e => e.target.files[0] && uploadFile(p.id, e.target.files[0])}
                      />
                    </label>
                    <button
                      onClick={() => loadPurchases(p.id)}
                      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm px-3 py-2"
                    >
                      {expanded === p.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Purchases
                    </button>
                  </div>
                </div>
              </div>

              {expanded === p.id && (
                <div className="border-t border-gray-700 p-4">
                  {(purchases[p.id] || []).length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No purchases yet</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 text-left">
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Bump</th>
                          <th className="pb-2">Downloads</th>
                          <th className="pb-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        {purchases[p.id].map(pur => (
                          <tr key={pur.id} className="border-t border-gray-700/50">
                            <td className="py-2">{pur.email}</td>
                            <td className="py-2">${(pur.amountPaid / 100).toFixed(2)}</td>
                            <td className="py-2">{pur.bumpAdded ? <span className="text-cyan-400">Yes</span> : 'No'}</td>
                            <td className="py-2">{pur.downloadCount}/{pur.maxDownloads}</td>
                            <td className="py-2">{new Date(pur.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
