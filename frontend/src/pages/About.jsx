import { Link } from "react-router-dom";
import { Cloud, ArrowRight, Heart, Users, Zap, Server, Monitor, Terminal, Gift, CheckCircle } from "lucide-react";
import { BlogNav, BlogFooter } from "./blog/BlogHeader";
import SEO from '../components/SEO';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="About CloudCode — Our Story"
        description="CloudCode started because everyone deserves access to powerful dev tools and CRM software. Get a full cloud desktop, free Go High Level CRM, and 500+ AI skills for $17/mo."
        path="/about"
      />
      <BlogNav />

      {/* Hero */}
      <section className="pt-36 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto px-4 relative">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
            <Heart className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300">Our Story</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">I scraped together $300 to afford my subscriptions.</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Most people don't have that much.</span>
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              That's the honest truth about how CloudCode started. I was lucky enough to pull together $300 for the tools I needed — a Claude Code subscription, a Go High Level account, hosting. The kinds of things you need to actually build and run an agency in 2026. But I kept thinking about the people who couldn't.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Not everyone has $300 lying around. Not everyone can afford a $97/month CRM <em>and</em> a cloud server <em>and</em> an AI coding subscription. But everyone deserves the chance to build something. That's what kept me up at night. And that's why I built this.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              CloudCode gives you everything you need to start your own agency for $17 a month. A full Ubuntu cloud computer with Claude Code, VS Code, and Cursor pre-installed. A free Go High Level CRM account. 500+ AI-powered business skills that generate professional documents in seconds. Monthly goodies and resources that are worth way more than what you're paying. We all win.
            </p>

            {/* Value breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 my-10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-cyan-400" />
                What You Get for $17/mo
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Monitor, text: "Full Ubuntu cloud desktop — access from any browser, any device" },
                  { icon: Terminal, text: "Claude Code, VS Code, and Cursor pre-installed and ready to go" },
                  { icon: Server, text: "8GB-32GB RAM with NVMe storage — a real development machine" },
                  { icon: Zap, text: "Free Go High Level CRM account (normally $97/mo on its own)" },
                  { icon: Gift, text: "500+ Claude Code business skills — sales pages, SEO audits, email sequences, and more" },
                  { icon: Users, text: "Access to the community, training, and monthly resource drops" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              This is all you need to start your own agency. That, and a Claude Code subscription. Then you can build anything you can think of. I'm not exaggerating. I've watched people go from zero to running client projects in a week with these tools. The barrier isn't talent or skill — it's access. And that's what we're removing.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              I'll be giving out training too. And yes, that includes knowing how to prompt AI to build things. How to talk to Claude Code so it actually does what you want. How to go from an idea in your head to a working product on a screen. That's the skill that changes everything in 2026, and I'm going to teach it for free inside the community.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Or, if you just want the server and the Go High Level account and want to skip the community stuff — that's fine too. Take the tools and go build. No hard feelings.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              But I'd really love to see you there.
            </p>

            {/* Signature */}
            <div className="border-t border-slate-800 pt-8">
              <p className="text-xl text-white font-medium mb-1">Sincerely,</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1">Benji Boyce</p>
              <p className="text-sm text-slate-500">Founder, CloudCode</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What We <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Believe</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Access Over Gatekeeping",
                description: "The tools to build a business shouldn't cost a fortune. We bundle everything — cloud computers, CRM, AI skills, training — so the only thing standing between you and your agency is the decision to start.",
                icon: Heart,
              },
              {
                title: "Build Anything You Can Think Of",
                description: "Claude Code plus a cloud environment means you can create websites, automations, client dashboards, AI agents, and more. If you can describe it, you can build it. We give you the environment to make it happen.",
                icon: Zap,
              },
              {
                title: "Community Over Competition",
                description: "We're not building a course empire. We're building a community where people help each other figure this out. Share templates. Debug together. Celebrate wins. That's how everyone levels up.",
                icon: Users,
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Who <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">This Is For</span>
          </h2>
          <div className="space-y-4">
            {[
              "You want to start a digital agency but can't afford $500/mo in tools",
              "You're a freelancer ready to level up with AI-powered workflows",
              "You've been thinking about building something but don't know where to start",
              "You want a cloud dev environment you can access from any device",
              "You need a CRM but Go High Level's $97/mo price tag is too steep on its own",
              "You want to learn how to prompt AI to build real products and services",
              "You just want the tools — no fluff, no upsells, no 47-step funnel",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-900/40 border border-slate-800/50 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Build Something?</span>
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Start your 3-day free trial. Get a cloud computer, a free CRM, 500+ AI skills, and a community that's got your back. $17/mo after that. Cancel anytime.
          </p>
          <Link
            to="/register?ref=about"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-slate-500 mt-4">No credit card required for the trial.</p>
        </div>
      </section>

      <BlogFooter />
    </div>
  );
}
