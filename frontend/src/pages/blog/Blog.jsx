import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Zap, Code, Terminal, Rocket, ChevronRight } from "lucide-react";
import skills, { categories } from "../../data/skills";
import { BlogBanner, BlogNav, DevEnvironmentAd, BlogFooter } from "./BlogHeader";

const blogSections = [
  {
    title: "Claude Code Skills Library",
    description: "500+ ready-to-use AI skills that generate professional documents, strategies, and plans in seconds. Just type a slash command and let Claude do the work.",
    href: "/blog/claude",
    icon: Terminal,
    gradient: "from-cyan-500 to-blue-600",
    shadow: "shadow-cyan-500/25",
    skillCount: skills.length,
    categoryCount: Object.keys(categories).length,
    featured: [
      { slug: "sales-page", title: "Sales Page Writer" },
      { slug: "seo-audit", title: "SEO Audit Generator" },
      { slug: "email-sequence", title: "Email Sequence Builder" },
      { slug: "business-plan", title: "Business Plan Creator" },
      { slug: "pitch-deck", title: "Pitch Deck Builder" },
      { slug: "landing-page-copy", title: "Landing Page Copywriter" },
    ]
  }
];

// Pick 12 popular skills to feature
const featuredSkills = [
  "sales-page","blog-post","email-sequence","seo-audit","business-plan","pitch-deck",
  "landing-page-copy","social-media-strategy","brand-voice-guide","customer-persona",
  "content-calendar","cold-outreach"
].map(slug => skills.find(s => s.slug === slug)).filter(Boolean);

// Category stats
const topCategories = Object.entries(categories)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 8);

export default function Blog() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BlogNav />

      {/* Hero */}
      <section className="pt-36 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-60 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center px-4 relative">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300">CloudCode Blog & Resources</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Learn, Build, and Scale</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">with AI-Powered Tools</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Guides, tutorials, and {skills.length}+ ready-to-use Claude Code skills to supercharge your business.
            From marketing to legal, sales to operations - generate professional documents in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/blog/claude"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
            >
              <Terminal className="w-5 h-5" />
              Browse {skills.length}+ Skills
            </Link>
            <Link
              to="/register?ref=blog"
              className="inline-flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition"
            >
              Download All Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Blog Section - Skills Library */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative group mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-3xl blur-2xl" />
            <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1 text-xs mb-4">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span className="text-cyan-300">{skills.length} Skills Across {Object.keys(categories).length} Categories</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Claude Code <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Skills Library</span>
                  </h2>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    The largest collection of AI-powered business skills for Claude Code.
                    Each skill is a slash command that generates complete, professional documents
                    customized to your business.
                  </p>
                  <Link
                    to="/blog/claude"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
                  >
                    Explore All Skills
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-xs text-slate-500">Terminal</span>
                  </div>
                  <div className="font-mono text-sm space-y-2">
                    <div><span className="text-emerald-400">$</span> <span className="text-slate-400">claude</span></div>
                    <div className="text-slate-500">Claude Code v1.0.17</div>
                    <div className="mt-3"><span className="text-cyan-400">/sales-page</span></div>
                    <div className="text-slate-500 text-xs mt-1">Generating your high-converting sales page...</div>
                    <div className="mt-3"><span className="text-cyan-400">/seo-audit</span></div>
                    <div className="text-slate-500 text-xs mt-1">Running comprehensive SEO analysis...</div>
                    <div className="mt-3"><span className="text-cyan-400">/email-sequence</span></div>
                    <div className="text-slate-500 text-xs mt-1">Building your 7-email nurture sequence...</div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-emerald-400">$</span>
                      <span className="w-2 h-4 bg-cyan-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-6 text-center">Browse by Category</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topCategories.map(([catName, catData]) => (
                <Link
                  key={catName}
                  to={`/blog/claude?category=${encodeURIComponent(catName)}`}
                  className="group bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">{catName}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition" />
                  </div>
                  <p className="text-2xl font-bold text-cyan-400">{catData.count}</p>
                  <p className="text-xs text-slate-500">skills available</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Skills */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-center">Most Popular Skills</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredSkills.map(skill => (
                <Link
                  key={skill.slug}
                  to={`/blog/claude/${skill.slug}`}
                  className="group bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 hover:bg-slate-900/90 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">{skill.category}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition" />
                  </div>
                  <h4 className="font-semibold text-white mb-2 group-hover:text-cyan-300 transition">{skill.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2">{skill.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <Code className="w-3 h-3" />
                    <span className="font-mono">/{skill.slug}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                to="/blog/claude"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition"
              >
                View all {skills.length} skills
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dev Environment Ad */}
      <section className="py-12 border-t border-slate-800/50">
        <div className="max-w-xl mx-auto px-4">
          <DevEnvironmentAd />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300">Free for everyone</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get All {skills.length}+ Skills{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Free</span>
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Create a free account to download the complete Claude Code skills bundle.
            One command installs all {skills.length} skills instantly.
          </p>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 max-w-lg mx-auto mb-8">
            <p className="text-sm text-slate-400 mb-1">Created by <span className="text-white font-medium">Benjamin Tate</span></p>
            <p className="text-sm text-slate-400 mb-3">Download the bundle, extract to your plugins folder, and enable:</p>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-emerald-400 space-y-1">
              <div>mkdir -p ~/.claude/plugins/local-marketplace</div>
              <div>unzip skills-ultimate-bundle.zip -d ~/.claude/plugins/local-marketplace/</div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Then add <code className="text-cyan-400">"skills-ultimate-bundle@local-skills": true</code> to your settings.json</p>
          </div>
          <Link
            to="/register?ref=blog"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <BlogFooter />
    </div>
  );
}
