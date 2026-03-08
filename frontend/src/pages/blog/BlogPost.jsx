import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Cloud, ArrowLeft, Copy, Check, ChevronRight, Zap, ArrowRight, Download, Mail, BookOpen, Terminal, Lightbulb, Users, CheckCircle } from "lucide-react";
import skills from "../../data/skills";

function EmailSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !name) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password: crypto.randomUUID().slice(0, 12) + "A1!" })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else if (res.status === 409) {
        // Already registered - still show success since they can download
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Something went wrong");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">You're In!</h3>
        <p className="text-slate-400 mb-6">Download your complete skills bundle below.</p>
        <a
          href="/downloads/claude-skills-bundle.json"
          download
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition"
        >
          <Download className="w-5 h-5" />
          Download Skills Bundle
        </a>
        <p className="text-xs text-slate-500 mt-4">Check your email for setup instructions!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Get All 500+ Skills Free</h3>
          <p className="text-sm text-slate-400">One-click install for Claude Code CLI</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          {status === "loading" ? "Creating account..." : "Download Skills Bundle"}
        </button>
        {status === "error" && <p className="text-red-400 text-sm">{errorMsg}</p>}
      </form>
      <p className="text-xs text-slate-500 mt-3 text-center">Free account. No credit card required.</p>
    </div>
  );
}

export default function BlogPost() {
  const { skillSlug } = useParams();
  const [copied, setCopied] = useState(false);

  const skill = skills.find(s => s.slug === skillSlug);
  if (!skill) return <Navigate to="/blog/claude" replace />;

  // Find related skills (same category, excluding current)
  const related = skills.filter(s => s.category === skill.category && s.slug !== skill.slug).slice(0, 4);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <Link to="/blog/claude" className="text-sm text-slate-400 hover:text-white transition">Skills Library</Link>
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition">Home</Link>
            <Link to="/register?ref=skills" className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition">
              Get Free Skills
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link to="/blog/claude" className="hover:text-cyan-400 transition">Skills Library</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-400">{skill.category}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{skill.title}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Title */}
              <div className="mb-8">
                <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">{skill.category}</span>
                <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4">{skill.title}</h1>
                <p className="text-lg text-slate-400 leading-relaxed">{skill.description}</p>
              </div>

              {/* How to Use */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold">How to Use This Skill</h2>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="ml-3 text-xs text-slate-500">Terminal</span>
                    </div>
                    <button
                      onClick={() => handleCopy(`/${skill.slug}`)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-5 font-mono text-sm">
                    <div className="text-slate-500 mb-2"># Open Claude Code in your terminal, then type:</div>
                    <div className="text-emerald-400">$ claude</div>
                    <div className="text-slate-400 mt-2"># Once Claude Code is running, use the skill:</div>
                    <div className="text-cyan-400 mt-1 text-lg font-semibold">/{skill.slug}</div>
                    <div className="text-slate-500 mt-3"># Claude will ask you questions about your specific needs</div>
                    <div className="text-slate-500"># and generate a complete {skill.title.toLowerCase()} for you.</div>
                  </div>
                </div>
              </section>

              {/* Who It's For */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold">Who This Skill Is For</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {skill.whoItsFor.map((who, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span className="text-slate-300">{who}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Benefits */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold">What You'll Get</h2>
                </div>
                <div className="space-y-3">
                  {skill.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                      <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Example Output */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold">Example Output</h2>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <p className="text-slate-300 leading-relaxed">{skill.exampleOutput}</p>
                </div>
              </section>

              {/* Install Instructions */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold">Install All 500+ Skills</h2>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
                  <p className="text-sm text-slate-400">
                    Created by <span className="text-white font-medium">Benjamin Tate</span>.
                    Sign up for a free account above to download the complete bundle, or follow the manual install steps below.
                  </p>

                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 1: Install Claude Code CLI</h4>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm">
                      <span className="text-emerald-400">npm install -g @anthropic-ai/claude-code</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 2: Download the Skills Bundle</h4>
                    <p className="text-xs text-slate-500 mb-2">Sign up above to get the download link, then extract to your Claude plugins folder:</p>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm space-y-1">
                      <div><span className="text-slate-500"># macOS / Linux:</span></div>
                      <div><span className="text-emerald-400">mkdir -p ~/.claude/plugins/local-marketplace</span></div>
                      <div><span className="text-emerald-400">unzip skills-ultimate-bundle.zip -d ~/.claude/plugins/local-marketplace/</span></div>
                      <div className="mt-2"><span className="text-slate-500"># Windows:</span></div>
                      <div><span className="text-emerald-400">mkdir %USERPROFILE%\.claude\plugins\local-marketplace</span></div>
                      <div><span className="text-slate-500"># Extract zip into that folder</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 3: Enable the Plugin</h4>
                    <p className="text-xs text-slate-500 mb-2">Add this to your <code className="text-cyan-400">~/.claude/settings.json</code>:</p>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm">
                      <div><span className="text-slate-500">{'{'}</span></div>
                      <div><span className="text-yellow-400">  "enabledPlugins"</span><span className="text-slate-500">: {'{'}</span></div>
                      <div><span className="text-yellow-400">    "skills-ultimate-bundle@local-skills"</span><span className="text-slate-500">:</span> <span className="text-emerald-400">true</span></div>
                      <div><span className="text-slate-500">  {'}'}</span></div>
                      <div><span className="text-slate-500">{'}'}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 4: Use Any Skill</h4>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm space-y-1">
                      <div><span className="text-slate-500"># Open Claude Code and type any skill command:</span></div>
                      <div><span className="text-emerald-400">$ claude</span></div>
                      <div><span className="text-cyan-400 text-lg font-semibold">/{skill.slug}</span></div>
                    </div>
                  </div>

                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                    <p className="text-xs text-slate-400">
                      All 500+ skills install at once. After setup, type <code className="text-cyan-400">/{'{'}skill-name{'}'}</code> in Claude Code to use any skill instantly.
                      Skills include: sales pages, SEO audits, email sequences, business plans, legal documents, and much more.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Email Signup CTA */}
              <div className="sticky top-24">
                <EmailSignup />

                {/* Related Skills */}
                {related.length > 0 && (
                  <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                    <h3 className="font-semibold text-white mb-4">Related Skills</h3>
                    <div className="space-y-2">
                      {related.map(r => (
                        <Link
                          key={r.slug}
                          to={`/blog/claude/${r.slug}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition group"
                        >
                          <span className="text-sm text-slate-300 group-hover:text-cyan-300 transition">{r.title}</span>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/blog/claude"
                      className="flex items-center justify-center gap-1 mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition"
                    >
                      View all skills <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

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
