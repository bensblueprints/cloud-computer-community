import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Cloud, Search, ChevronRight, Zap, ArrowRight } from "lucide-react";
import skills, { categories } from "../../data/skills";

const ITEMS_PER_PAGE = 24;

export default function BlogIndex() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = skills;
    if (activeCategory !== "All") {
      result = result.filter(s => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }
    return result;
  }, [search, activeCategory]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const visible = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const categoryList = ["All", ...Object.keys(categories)];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">CloudCode</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/blog/claude" className="text-sm text-cyan-400 font-medium">Skills Library</Link>
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition">Home</Link>
            <Link to="/register" className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition">
              Get Free Skills
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto text-center px-4 relative">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300">{skills.length}+ AI-Powered Skills for Claude Code</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Claude Code</span>{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Skills Library</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Browse {skills.length}+ ready-to-use skills that turn Claude Code into your personal business assistant.
            Each skill generates professional documents, strategies, and plans in seconds.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search skills... (e.g. SEO, email, sales page)"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {categoryList.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeCategory === cat
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white"
              }`}
            >
              {cat === "All" ? `All (${skills.length})` : `${cat} (${skills.filter(s => s.category === cat).length})`}
            </button>
          ))}
        </div>
      </section>

      {/* Skills Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        {visible.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No skills found matching "{search}"</p>
            <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="mt-4 text-cyan-400 hover:text-cyan-300">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map(skill => (
              <Link
                key={skill.slug}
                to={`/blog/claude/${skill.slug}`}
                className="group bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 hover:bg-slate-900/90 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">{skill.category}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition" />
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-300 transition">{skill.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{skill.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {skill.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo(0, 400); }}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                  page === p
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-cyan-500/30"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get All {skills.length}+ Skills <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Free</span>
          </h2>
          <p className="text-sm text-slate-500 mb-2">Created by <span className="text-white font-medium">Benjamin Tate</span></p>
          <p className="text-slate-400 mb-8">
            Sign up for a free CloudCode account and download the complete skills bundle with install instructions.
          </p>
          <Link
            to="/register?ref=skills"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
          >
            Download All Skills Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-500">CloudCode Skills Library</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <Link to="/blog/claude" className="hover:text-white transition">All Skills</Link>
            <Link to="/register" className="hover:text-white transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
