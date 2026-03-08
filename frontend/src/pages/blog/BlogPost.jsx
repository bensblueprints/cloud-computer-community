import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Copy, Check, ChevronRight, Zap, ArrowRight, Download, BookOpen, Terminal, Lightbulb, Users, CheckCircle, ExternalLink } from "lucide-react";
import skills from "../../data/skills";
import { BlogNav, BlogFooter, DevEnvironmentAd } from "./BlogHeader";

function EmailSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle");
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
      if (res.ok || res.status === 409) {
        setStatus("success");
      } else {
        const data = await res.json();
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
    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Get All 500+ Skills Free</h3>
          <p className="text-xs text-slate-400">By Benjamin Tate</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50" />
        <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50" />
        <button type="submit" disabled={status === "loading"} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50">
          {status === "loading" ? "Creating account..." : "Download Skills Bundle"}
        </button>
        {status === "error" && <p className="text-red-400 text-sm">{errorMsg}</p>}
      </form>
      <p className="text-xs text-slate-500 mt-3 text-center">Free account. No credit card required.</p>
    </div>
  );
}

// Simple markdown-like renderer for blog content
function BlogContent({ content, outboundLinks }) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold text-white mt-8 mb-4">{line.slice(3)}</h2>);
      i++; continue;
    }
    // H3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-semibold text-white mt-6 mb-3">{line.slice(4)}</h3>);
      i++; continue;
    }
    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <div key={i} className="border-l-4 border-cyan-500/30 pl-4 py-2 my-3 bg-cyan-500/5 rounded-r-lg">
          <p className="text-sm text-slate-400 italic">{renderInline(line.slice(2))}</p>
        </div>
      );
      i++; continue;
    }
    // Bullet with link (markdown link format)
    if (line.startsWith('- [')) {
      const linkMatch = line.match(/^- \[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        elements.push(
          <div key={i} className="flex items-center gap-2 ml-4 my-1">
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 transition underline underline-offset-2">
              {linkMatch[1]}
            </a>
          </div>
        );
        i++; continue;
      }
    }
    // Bullet
    if (line.startsWith('- ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 ml-4 my-1">
          <span className="text-cyan-400 mt-1.5 text-xs">&#9679;</span>
          <p className="text-sm text-slate-300">{renderInline(line.slice(2))}</p>
        </div>
      );
      i++; continue;
    }
    // Empty line
    if (line.trim() === '') {
      i++; continue;
    }
    // Regular paragraph
    elements.push(<p key={i} className="text-slate-300 leading-relaxed my-2">{renderInline(line)}</p>);
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return <code key={`${i}-${j}`} className="text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded text-sm">{cp.slice(1, -1)}</code>;
      }
      return cp;
    });
  });
}

export default function BlogPost() {
  const { skillSlug } = useParams();
  const [copied, setCopied] = useState(false);

  const skill = skills.find(s => s.slug === skillSlug);
  if (!skill) return <Navigate to="/blog/claude" replace />;

  const related = skills.filter(s => s.category === skill.category && s.slug !== skill.slug).slice(0, 4);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BlogNav />

      <main className="pt-36 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 flex-wrap">
            <Link to="/blog" className="hover:text-cyan-400 transition">Blog</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/blog/claude" className="hover:text-cyan-400 transition">Skills Library</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-400">{skill.category}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{skill.title}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Title & Meta */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">{skill.category}</span>
                  <span className="text-xs text-slate-500">By Benjamin Tate</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{skill.title}</h1>
                <p className="text-lg text-slate-400 leading-relaxed">{skill.description}</p>
              </div>

              {/* Blog Content from SKILL.md */}
              {skill.blogContent && (
                <section className="mb-10">
                  <BlogContent content={skill.blogContent} outboundLinks={skill.outboundLinks} />
                </section>
              )}

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
                    <button onClick={() => handleCopy(`/${skill.slug}`)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-5 font-mono text-sm">
                    <div className="text-emerald-400">$ claude</div>
                    <div className="text-slate-500 mt-1">Claude Code v1.0.17</div>
                    <div className="text-cyan-400 mt-3 text-lg font-semibold">/{skill.slug}</div>
                    <div className="text-slate-500 mt-2"># Claude asks about your specific needs and generates</div>
                    <div className="text-slate-500"># a complete {skill.title.toLowerCase()} customized for you.</div>
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

              {/* Outbound Links */}
              {skill.outboundLinks && skill.outboundLinks.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <ExternalLink className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">Further Reading</h2>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3">
                    {skill.outboundLinks.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition group">
                        <ExternalLink className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300 group-hover:text-cyan-300 transition">{link.text}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Install Instructions */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold">Install All 500+ Skills</h2>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
                  <p className="text-sm text-slate-400">
                    Created by <span className="text-white font-medium">Benjamin Tate</span>.
                    Sign up for a free account above to download the complete bundle.
                  </p>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 1: Install Claude Code CLI</h4>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm">
                      <span className="text-emerald-400">npm install -g @anthropic-ai/claude-code</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 2: Download & Extract the Skills Bundle</h4>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm space-y-1">
                      <div><span className="text-slate-500"># macOS / Linux:</span></div>
                      <div><span className="text-emerald-400">mkdir -p ~/.claude/plugins/local-marketplace</span></div>
                      <div><span className="text-emerald-400">unzip skills-ultimate-bundle.zip -d ~/.claude/plugins/local-marketplace/</span></div>
                      <div className="mt-2"><span className="text-slate-500"># Windows:</span></div>
                      <div><span className="text-emerald-400">mkdir %USERPROFILE%\.claude\plugins\local-marketplace</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 3: Enable the Plugin</h4>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm">
                      <div><span className="text-slate-500">{"{"}</span></div>
                      <div><span className="text-yellow-400">  "enabledPlugins"</span><span className="text-slate-500">: {"{"}</span></div>
                      <div><span className="text-yellow-400">    "skills-ultimate-bundle@local-skills"</span><span className="text-slate-500">:</span> <span className="text-emerald-400">true</span></div>
                      <div><span className="text-slate-500">  {"}"}</span></div>
                      <div><span className="text-slate-500">{"}"}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Step 4: Use Any Skill</h4>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm">
                      <div><span className="text-emerald-400">$ claude</span></div>
                      <div><span className="text-cyan-400 text-lg font-semibold">/{skill.slug}</span></div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-36">
                <EmailSignup />

                {/* Dev Environment Ad */}
                <div className="mt-6">
                  <DevEnvironmentAd />
                </div>

                {/* Related Skills */}
                {related.length > 0 && (
                  <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                    <h3 className="font-semibold text-white mb-4">Related Skills</h3>
                    <div className="space-y-2">
                      {related.map(r => (
                        <Link key={r.slug} to={`/blog/claude/${r.slug}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition group">
                          <span className="text-sm text-slate-300 group-hover:text-cyan-300 transition">{r.title}</span>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                        </Link>
                      ))}
                    </div>
                    <Link to="/blog/claude" className="flex items-center justify-center gap-1 mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition">
                      View all skills <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}
