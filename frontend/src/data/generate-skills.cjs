const fs = require('fs');
const path = require('path');

// Path to the actual skill files
const SKILLS_DIR = path.join('C:', 'Users', 'admin', '.claude', 'plugins', 'local-marketplace', 'plugins', 'skills-ultimate-bundle', 'skills');

// Category mapping
const categoryMap = {
  "Marketing & Advertising": ["ab-test-plan","ad-creative-brief","ad-performance-report","ad-spend-calculator","attribution-model","cause-marketing-campaign","co-marketing-plan","competitor-analysis","conversion-funnel-analysis","facebook-ad-campaign","flash-sale-campaign","google-ads-campaign","google-business-profile","influencer-campaign-brief","influencer-outreach","linkedin-ad-campaign","lookalike-audience-plan","market-research","market-sizing","media-buy-plan","retargeting-strategy","seasonal-campaign","landing-page-audit","landing-page-copy"],
  "Sales & Revenue": ["cart-recovery-sms","checkout-optimizer","cold-outreach","commission-structure","cross-sell-strategy","discount-strategy","discovery-call-script","downsell-sequence","high-ticket-sales-page","objection-handler","order-bump-copy","payment-plan-offer","pricing-analysis","pricing-calculator","pricing-page-copy","pricing-strategy","sales-battlecard","sales-deck","sales-email-template","sales-funnel-builder","sales-page","sales-script","tripwire-offer","upsell-sequence","webinar-sales-script","referral-program","referral-bonus-plan"],
  "Content Creation": ["article-rewriter","blog-post","book-outline","book-proposal","caption-writer","case-study","comparison-article","content-audit","content-brief","content-calendar","content-cluster-plan","content-gap-finder","content-pillar-strategy","content-repurpose","content-style-guide","ebook-outline","ghostwriter-brief","headline-generator","hook-generator","lead-magnet","listicle-generator","microcopy-writer","newsletter-builder","pillar-page","prompt-library","script-to-blog","thread-hook-writer","tutorial-writer","video-script","viral-content-formula","white-paper","authority-content-strategy","thought-leader-content-plan","thought-leadership"],
  "Email Marketing": ["abandoned-cart-email","black-friday-emails","drip-campaign","email-ab-test-plan","email-deliverability-audit","email-design-system","email-list-cleanup","email-newsletter-template","email-preference-center","email-sequence","email-subject-line-tester","launch-email-sequence","milestone-email","product-launch-email","re-engagement-email","renewal-campaign","thank-you-campaign","transactional-email","trial-to-paid-email","two-sided-email-strategy","webinar-email-sequence","welcome-sequence","win-back-campaign","newsletter-strategy"],
  "SEO & Technical": ["featured-snippet-optimizer","keyword-research","link-building-plan","local-seo-plan","marketplace-seo","meta-tag-optimizer","schema-markup-guide","seo-audit","seo-competitor-analysis","seo-content-brief","seo-migration-plan","seo-reporting-template","site-architecture-plan","technical-seo-checklist","youtube-seo","analytics-setup-guide"],
  "Brand & Design": ["brand-architecture","brand-audit","brand-identity-guide","brand-photography-brief","brand-positioning-statement","brand-refresh","brand-story","brand-tagline","brand-voice-guide","color-palette-generator","icon-set-brief","media-kit","merch-design-brief","naming-workshop","packaging-brief","press-kit","rebrand-plan","signage-brief","style-tile","visual-identity-brief","personal-brand-strategy"],
  "Social Media": ["facebook-group-plan","hashtag-strategy","instagram-carousel","linkedin-article","linkedin-profile-optimizer","linkedin-strategy","meme-content-brief","pinterest-strategy","reddit-strategy","short-form-video-plan","social-listening-plan","social-media-audit","social-media-calendar","social-media-graphics","social-media-policy","social-media-strategy","social-proof-collector","tiktok-ad-script","tiktok-script","twitter-thread","user-generated-content","youtube-ad-script","youtube-strategy","youtube-thumbnail"],
  "Legal & Compliance": ["accessibility-policy","ai-content-policy","ai-ethics-policy","cease-and-desist","client-agreement","collaboration-agreement","compliance-checklist","cookie-policy","copyright-notice","data-processing-agreement","disclaimer-generator","diversity-policy","exchange-policy","gdpr-compliance-checklist","health-disclaimer","independent-contractor-agreement","intellectual-property-audit","licensing-agreement","nda-template","non-compete-agreement","partnership-agreement","payment-terms-policy","privacy-policy","return-policy","saas-agreement","service-level-agreement","shipping-policy","subcontractor-agreement","supplement-disclaimer","terms-of-service","terms-of-use-app","trademark-application","waiver-release","workplace-policy"],
  "Finance & Operations": ["bookkeeping-setup","breakeven-analysis","budget-planner","cash-flow-forecast","cost-analysis","expense-policy","expense-tracker","financial-dashboard","financial-model","financial-projection","fundraising-tracker","inventory-management","invoice-template","profit-loss-report","revenue-forecast","revenue-model","roi-calculator","tax-deduction-finder","tax-prep-checklist","unit-economics","report-automation","subscription-metrics"],
  "HR & Management": ["benefits-guide","compensation-plan","culture-document","delegation-framework","employee-handbook","employee-survey","exit-interview-template","hiring-scorecard","interview-question-bank","job-posting","offer-letter","offboarding-checklist","okr-builder","onboarding-checklist","one-on-one-template","performance-review","pip-template","remote-team-handbook","remote-work-policy","succession-plan","team-building-plan","team-charter","training-manual","training-plan"],
  "Customer Experience": ["chatbot-script","churn-analysis","churn-prevention-playbook","client-crm","client-feedback-system","client-intake-form","client-report-template","complaint-resolution","customer-advisory-board","customer-health-score","customer-journey-map","customer-lifetime-value","customer-persona","customer-review-strategy","customer-segmentation","customer-success-playbook","customer-support-kb","customer-win-story","escalation-procedure","faq-generator","help-center-article","nps-survey","review-response","satisfaction-survey","self-service-portal","service-guarantee","service-recovery-plan","support-response-templates","testimonial-collector","voice-of-customer","sentiment-analysis","feedback-analysis"],
  "Events & Community": ["ambassador-program","community-launch","community-moderation","conference-planner","event-budget-planner","event-follow-up","event-marketing-plan","event-planner","event-registration-page","event-run-of-show","event-sponsorship-proposal","hybrid-event-plan","mastermind-group","networking-event-plan","networking-strategy","platform-community-guidelines","retreat-planner","virtual-event-platform","webinar-planner","workshop-builder","workshop-handout"],
  "Product & Platform": ["api-documentation","batch-processing-system","beta-launch-plan","feature-announcement","feature-request-system","knowledge-base-builder","launch-assets","launch-checklist","marketplace-fee-structure","marketplace-launch-plan","marketplace-listing","marketplace-metrics","no-code-app-plan","onboarding-flow","platform-help-center","platform-migration","platform-partnership","platform-trust-system","product-changelog","product-comparison","product-description","product-faq","product-feedback-loop","product-hunt-launch","product-launch-plan","product-listing-optimizer","product-photography-brief","product-recall-plan","product-roadmap","product-sourcing-brief","release-notes","saas-cancellation-flow","saas-evaluation","saas-metrics-dashboard","saas-onboarding-flow","tech-stack-recommendation"],
  "Education & Learning": ["certification-program","class-schedule-planner","coaching-framework","cohort-program","continuing-education","course-outline","curriculum-review","diagnostic-assessment","group-program-design","homework-assignment","learning-path","lesson-plan","mentorship-program","micro-course","skill-assessment","student-feedback-form","study-guide"],
  "Business Strategy": ["annual-planning","annual-review","benchmarking-report","business-continuity-plan","business-plan","change-management-plan","consulting-framework","consulting-proposal-template","decision-matrix","digital-product-plan","joint-venture-proposal","kpi-dashboard","letter-of-intent","mission-statement","pitch-deck","quarterly-review","risk-assessment","strategic-alliance-plan","swot-analysis","value-proposition-canvas","annual-report-writer","investor-update"],
  "Agency & Freelance": ["agency-onboarding","client-transformation-story","contractor-brief","freelance-rate-card","freelancer-management","proposal-writer","rate-negotiation-script","retainer-agreement","scope-of-work","project-scope-change","project-tracker","status-update-template","weekly-report"],
  "Podcasts & Speaking": ["podcast-ad-script","podcast-guest-pitch","podcast-launch","podcast-one-sheet","podcast-show-notes","signature-talk","speaker-outreach","speaking-one-sheet","speaking-proposal","speech-writer","ted-talk-outline"],
  "Real Estate": ["investment-property-analysis","lease-agreement-checklist","neighborhood-guide","open-house-plan","property-listing","property-management-sop","real-estate-crm-setup","real-estate-newsletter","rental-listing","tenant-screening-checklist"],
  "E-commerce": ["bundle-creator","collection-page-copy","cross-border-selling","dropshipping-supplier-brief","fulfillment-sop","gift-guide","loyalty-program","seasonal-inventory-plan","seller-onboarding","size-guide","store-launch-plan","store-page-audit","subscription-box-plan","unboxing-experience","wholesale-catalog"],
  "Food & Hospitality": ["catering-proposal","food-delivery-strategy","food-photography-brief","food-truck-business-plan","menu-design-brief","nutrition-content-plan","recipe-card","restaurant-marketing-plan","restaurant-review-response","restaurant-sop","seasonal-menu-plan"],
  "Nonprofit": ["award-application","donation-page-copy","grant-application","grant-report","impact-report","nonprofit-board-packet","nonprofit-fundraising-letter","social-impact-measurement","volunteer-recruitment"],
  "Wellness & Lifestyle": ["energy-management","fitness-program-outline","morning-routine-builder","wellness-assessment","wellness-workshop-plan","time-audit","task-prioritization"],
};

// Reverse map: slug -> category
const slugToCategory = {};
for (const [cat, slugs] of Object.entries(categoryMap)) {
  for (const s of slugs) slugToCategory[s] = cat;
}

// Icon mapping by category
const categoryIcons = {
  "Marketing & Advertising": "Megaphone", "Sales & Revenue": "TrendingUp", "Content Creation": "PenTool",
  "Email Marketing": "Mail", "SEO & Technical": "Search", "Brand & Design": "Palette",
  "Social Media": "Share2", "Legal & Compliance": "Shield", "Finance & Operations": "DollarSign",
  "HR & Management": "Users", "Customer Experience": "Heart", "Events & Community": "Calendar",
  "Product & Platform": "Package", "Education & Learning": "BookOpen", "Business Strategy": "Briefcase",
  "Agency & Freelance": "Briefcase", "Podcasts & Speaking": "Mic", "Real Estate": "Home",
  "E-commerce": "Package", "Food & Hospitality": "Award", "Nonprofit": "Heart",
  "Wellness & Lifestyle": "Zap", "Other": "Star"
};

// Outbound links by category for SEO
const categoryLinks = {
  "Marketing & Advertising": [
    { text: "HubSpot Marketing Blog", url: "https://blog.hubspot.com/marketing" },
    { text: "Google Ads Help Center", url: "https://support.google.com/google-ads" },
    { text: "Neil Patel's Marketing Guide", url: "https://neilpatel.com/blog/" }
  ],
  "Sales & Revenue": [
    { text: "Salesforce Sales Resources", url: "https://www.salesforce.com/resources/" },
    { text: "Gong Revenue Intelligence", url: "https://www.gong.io/blog/" },
    { text: "Close.com Sales Blog", url: "https://blog.close.com/" }
  ],
  "Content Creation": [
    { text: "Content Marketing Institute", url: "https://contentmarketinginstitute.com/" },
    { text: "Copyblogger", url: "https://copyblogger.com/" },
    { text: "Grammarly Writing Tips", url: "https://www.grammarly.com/blog/" }
  ],
  "Email Marketing": [
    { text: "Mailchimp Resources", url: "https://mailchimp.com/resources/" },
    { text: "Litmus Email Blog", url: "https://www.litmus.com/blog/" },
    { text: "Really Good Emails", url: "https://reallygoodemails.com/" }
  ],
  "SEO & Technical": [
    { text: "Moz SEO Learning Center", url: "https://moz.com/learn/seo" },
    { text: "Ahrefs Blog", url: "https://ahrefs.com/blog/" },
    { text: "Google Search Central", url: "https://developers.google.com/search" }
  ],
  "Brand & Design": [
    { text: "Canva Design School", url: "https://www.canva.com/designschool/" },
    { text: "Dribbble Design Blog", url: "https://dribbble.com/stories" },
    { text: "Brand New (UnderConsideration)", url: "https://www.underconsideration.com/brandnew/" }
  ],
  "Social Media": [
    { text: "Hootsuite Blog", url: "https://blog.hootsuite.com/" },
    { text: "Buffer Resources", url: "https://buffer.com/resources/" },
    { text: "Sprout Social Insights", url: "https://sproutsocial.com/insights/" }
  ],
  "Legal & Compliance": [
    { text: "LegalZoom Resources", url: "https://www.legalzoom.com/articles/" },
    { text: "GDPR Official Site", url: "https://gdpr.eu/" },
    { text: "Nolo Legal Encyclopedia", url: "https://www.nolo.com/" }
  ],
  "Finance & Operations": [
    { text: "Investopedia", url: "https://www.investopedia.com/" },
    { text: "QuickBooks Resources", url: "https://quickbooks.intuit.com/r/" },
    { text: "SCORE Financial Templates", url: "https://www.score.org/resource-library" }
  ],
  "HR & Management": [
    { text: "SHRM Resources", url: "https://www.shrm.org/" },
    { text: "Harvard Business Review", url: "https://hbr.org/" },
    { text: "BambooHR Blog", url: "https://www.bamboohr.com/blog/" }
  ],
  "Customer Experience": [
    { text: "Zendesk CX Trends", url: "https://www.zendesk.com/blog/" },
    { text: "Intercom Blog", url: "https://www.intercom.com/blog/" },
    { text: "Forrester CX Research", url: "https://www.forrester.com/" }
  ],
  "Events & Community": [
    { text: "Eventbrite Blog", url: "https://www.eventbrite.com/blog/" },
    { text: "CMX Hub Community", url: "https://cmxhub.com/" },
    { text: "Meetup Pro", url: "https://www.meetup.com/pro/" }
  ],
  "Product & Platform": [
    { text: "Product Hunt", url: "https://www.producthunt.com/" },
    { text: "Mind the Product", url: "https://www.mindtheproduct.com/" },
    { text: "Lenny's Newsletter", url: "https://www.lennysnewsletter.com/" }
  ],
  "Education & Learning": [
    { text: "Coursera for Business", url: "https://www.coursera.org/business" },
    { text: "Teachable Blog", url: "https://teachable.com/blog" },
    { text: "EdSurge", url: "https://www.edsurge.com/" }
  ],
  "Business Strategy": [
    { text: "Harvard Business Review", url: "https://hbr.org/" },
    { text: "McKinsey Insights", url: "https://www.mckinsey.com/featured-insights" },
    { text: "Strategyzer", url: "https://www.strategyzer.com/blog" }
  ],
  "Agency & Freelance": [
    { text: "Freelancers Union", url: "https://www.freelancersunion.org/" },
    { text: "Agency Analytics Blog", url: "https://agencyanalytics.com/blog" },
    { text: "Toggl Track", url: "https://toggl.com/blog/" }
  ],
  "Podcasts & Speaking": [
    { text: "Podcast Insights", url: "https://www.podcastinsights.com/" },
    { text: "TED Speaker Resources", url: "https://www.ted.com/participate/ted-talks-tips" },
    { text: "Buzzsprout Blog", url: "https://www.buzzsprout.com/blog" }
  ],
  "Real Estate": [
    { text: "Zillow Research", url: "https://www.zillow.com/research/" },
    { text: "NAR Resources", url: "https://www.nar.realtor/research-and-statistics" },
    { text: "BiggerPockets", url: "https://www.biggerpockets.com/blog" }
  ],
  "E-commerce": [
    { text: "Shopify Blog", url: "https://www.shopify.com/blog" },
    { text: "BigCommerce Essentials", url: "https://www.bigcommerce.com/blog/" },
    { text: "Practical Ecommerce", url: "https://www.practicalecommerce.com/" }
  ],
  "Food & Hospitality": [
    { text: "Restaurant Business Online", url: "https://www.restaurantbusinessonline.com/" },
    { text: "Toast Restaurant Blog", url: "https://pos.toasttab.com/blog" },
    { text: "Food Network Tips", url: "https://www.foodnetwork.com/" }
  ],
  "Nonprofit": [
    { text: "Nonprofit Quarterly", url: "https://nonprofitquarterly.org/" },
    { text: "Candid (GuideStar)", url: "https://www.guidestar.org/" },
    { text: "Chronicle of Philanthropy", url: "https://www.philanthropy.com/" }
  ],
  "Wellness & Lifestyle": [
    { text: "Well+Good", url: "https://www.wellandgood.com/" },
    { text: "Headspace Blog", url: "https://www.headspace.com/articles" },
    { text: "Healthline", url: "https://www.healthline.com/" }
  ],
};

// Title overrides
const titleOverrides = {
  "ab-test-plan": "A/B Test Plan Generator",
  "api-documentation": "API Documentation Writer",
  "ai-content-policy": "AI Content Policy Generator",
  "ai-ethics-policy": "AI Ethics Policy Framework",
  "ai-use-case-finder": "AI Use Case Finder",
  "faq-generator": "FAQ Generator",
  "gdpr-compliance-checklist": "GDPR Compliance Checklist",
  "kpi-dashboard": "KPI Dashboard Builder",
  "nda-template": "NDA Template Generator",
  "nps-survey": "NPS Survey Builder",
  "okr-builder": "OKR Builder",
  "pip-template": "PIP Template Generator",
  "pr-pitch": "PR Pitch Writer",
  "roi-calculator": "ROI Calculator Builder",
  "saas-agreement": "SaaS Agreement Writer",
  "saas-cancellation-flow": "SaaS Cancellation Flow Designer",
  "saas-evaluation": "SaaS Evaluation Framework",
  "saas-metrics-dashboard": "SaaS Metrics Dashboard",
  "saas-onboarding-flow": "SaaS Onboarding Flow Builder",
  "seo-audit": "SEO Audit Generator",
  "seo-competitor-analysis": "SEO Competitor Analysis",
  "seo-content-brief": "SEO Content Brief Writer",
  "seo-migration-plan": "SEO Migration Plan",
  "seo-reporting-template": "SEO Reporting Template",
  "sop-builder": "SOP Builder",
  "swot-analysis": "SWOT Analysis Generator",
  "ted-talk-outline": "TED Talk Outline Builder",
  "youtube-seo": "YouTube SEO Optimizer",
  "youtube-ad-script": "YouTube Ad Script Writer",
  "youtube-strategy": "YouTube Strategy Planner",
  "youtube-thumbnail": "YouTube Thumbnail Brief",
  "tiktok-ad-script": "TikTok Ad Script Writer",
  "tiktok-script": "TikTok Script Writer",
  "linkedin-ad-campaign": "LinkedIn Ad Campaign Builder",
  "linkedin-article": "LinkedIn Article Writer",
  "linkedin-profile-optimizer": "LinkedIn Profile Optimizer",
  "linkedin-strategy": "LinkedIn Strategy Planner",
  "facebook-ad-campaign": "Facebook Ad Campaign Builder",
  "facebook-group-plan": "Facebook Group Strategy",
  "google-ads-campaign": "Google Ads Campaign Builder",
  "google-business-profile": "Google Business Profile Optimizer",
};

function slugToTitle(slug) {
  if (titleOverrides[slug]) return titleOverrides[slug];
  return slug.split('-').map(w => {
    if (["a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","as","is"].includes(w) && slug.split('-').indexOf(w) > 0) return w;
    if (w === "sms") return "SMS";
    if (w === "crm") return "CRM";
    if (w === "sop") return "SOP";
    if (w === "b2b") return "B2B";
    if (w === "ab") return "A/B";
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

// Parse SKILL.md frontmatter and content
function parseSkillMd(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: {}, body: content };

  const fmRaw = fmMatch[1];
  const body = fmMatch[2].trim();

  // Simple YAML parsing
  const fm = {};
  fmRaw.split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?$/);
    if (m) fm[m[1]] = m[2];
  });

  return { frontmatter: fm, body };
}

// Extract sections from markdown body
function extractSections(body) {
  const sections = {};
  let currentSection = '';
  let currentContent = [];

  body.split('\n').forEach(line => {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = h2[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });
  if (currentSection) sections[currentSection] = currentContent.join('\n').trim();

  return sections;
}

// Extract "When to Use" bullet points
function extractWhenToUse(sections) {
  const whenSection = sections['When to Use This Skill'] || '';
  const bullets = [];
  whenSection.split('\n').forEach(line => {
    const m = line.match(/^-\s+(.+)$/);
    if (m) bullets.push(m[1].trim());
  });
  return bullets;
}

// Extract DO NOT use guidance
function extractDoNotUse(sections) {
  const whenSection = sections['When to Use This Skill'] || '';
  const m = whenSection.match(/\*\*DO NOT\*\*\s+(.+?)(?:\n|$)/);
  return m ? m[1].trim() : '';
}

// Generate SEO description from actual skill content
function generateSeoDescription(slug, title, frontmatter, sections, body) {
  const desc = frontmatter.description || '';
  const whenBullets = extractWhenToUse(sections);

  // Build a rich, unique SEO description from the actual skill content
  let seoDesc = desc;
  if (whenBullets.length > 0) {
    seoDesc += ' Perfect for when you need to ' + whenBullets.slice(0, 2).join(', or ').toLowerCase() + '.';
  }
  // Cap at 300 chars for meta description friendliness
  if (seoDesc.length > 300) seoDesc = seoDesc.substring(0, 297) + '...';
  return seoDesc;
}

// Generate "Who it's for" from content analysis
function generateWhoItsFor(slug, cat, sections) {
  const whenBullets = extractWhenToUse(sections);
  const bodyText = Object.values(sections).join(' ').toLowerCase();

  const audienceMap = {
    "Marketing & Advertising": ["Marketing managers", "Growth marketers", "Agency owners", "CMOs", "Media buyers"],
    "Sales & Revenue": ["Sales managers", "Founders", "Revenue leaders", "E-commerce owners", "Sales reps"],
    "Content Creation": ["Content marketers", "Bloggers", "Copywriters", "Brand managers", "Course creators"],
    "Email Marketing": ["Email marketers", "E-commerce owners", "Marketing managers", "Newsletter creators"],
    "SEO & Technical": ["SEO specialists", "Content strategists", "Web developers", "Digital marketers"],
    "Brand & Design": ["Brand managers", "Designers", "Founders", "Creative directors", "Marketing teams"],
    "Social Media": ["Social media managers", "Content creators", "Influencers", "Brand managers"],
    "Legal & Compliance": ["Business owners", "Legal teams", "Compliance officers", "Startup founders"],
    "Finance & Operations": ["CFOs", "Business owners", "Operations managers", "Startup founders"],
    "HR & Management": ["HR managers", "Team leads", "Business owners", "People operations"],
    "Customer Experience": ["Customer success managers", "Support leads", "Product managers", "CX directors"],
    "Events & Community": ["Event planners", "Community managers", "Marketing managers", "Organizers"],
    "Product & Platform": ["Product managers", "Founders", "CTOs", "Development leads"],
    "Education & Learning": ["Educators", "Course creators", "Training managers", "Coaches"],
    "Business Strategy": ["CEOs", "Founders", "Strategy consultants", "Business analysts"],
    "Agency & Freelance": ["Agency owners", "Freelancers", "Consultants", "Project managers"],
    "Podcasts & Speaking": ["Podcast hosts", "Public speakers", "Thought leaders", "Content creators"],
    "Real Estate": ["Real estate agents", "Property managers", "Investors", "Brokers"],
    "E-commerce": ["E-commerce owners", "Shopify merchants", "DTC brands", "Marketplace sellers"],
    "Food & Hospitality": ["Restaurant owners", "Chefs", "Food entrepreneurs", "Hospitality managers"],
    "Nonprofit": ["Nonprofit directors", "Fundraisers", "Grant writers", "Board members"],
    "Wellness & Lifestyle": ["Coaches", "Wellness practitioners", "Entrepreneurs", "Fitness professionals"],
  };
  return audienceMap[cat] || ["Business owners", "Professionals", "Entrepreneurs", "Managers"];
}

// Generate benefits from actual content
function generateBenefits(slug, title, sections, body) {
  const benefits = [];
  const whenBullets = extractWhenToUse(sections);

  // Benefit 1: from the first when-to-use bullet
  if (whenBullets[0]) {
    benefits.push(`Instantly ${whenBullets[0].charAt(0).toLowerCase() + whenBullets[0].slice(1).replace(/\.$/, '')} with AI-generated frameworks and proven templates`);
  } else {
    benefits.push(`Generate a professional ${title.toLowerCase()} in seconds instead of spending hours starting from scratch`);
  }

  // Benefit 2: structure/framework benefit
  if (body.includes('table') || body.includes('Template') || body.includes('framework') || body.includes('Framework')) {
    benefits.push('Follow battle-tested frameworks and structured templates used by industry professionals');
  } else {
    benefits.push('Get a customized, ready-to-use deliverable tailored to your specific business needs');
  }

  // Benefit 3: outcome benefit
  if (whenBullets[1]) {
    benefits.push(`Also helps you ${whenBullets[1].charAt(0).toLowerCase() + whenBullets[1].slice(1).replace(/\.$/, '')}`);
  } else {
    benefits.push('Save time and ensure nothing is missed with comprehensive, structured output');
  }

  return benefits;
}

// Generate example output description from actual content
function generateExampleOutput(slug, title, sections, body) {
  const sectionNames = Object.keys(sections).filter(s =>
    s !== 'When to Use This Skill' && s !== 'Recovery' && s !== 'Anti-Patterns' && s !== 'Pre-Delivery Checklist'
  );

  if (sectionNames.length > 2) {
    const keyParts = sectionNames.slice(0, 4).map(s => s.toLowerCase()).join(', ');
    return `A complete, professionally structured ${title.toLowerCase()} covering ${keyParts}, and more. Fully customized to your business with actionable sections ready for immediate implementation.`;
  }

  return `A comprehensive ${title.toLowerCase()} with all essential sections, structured frameworks, and actionable recommendations tailored to your specific business needs and goals.`;
}

// Generate SEO-friendly blog body content from the SKILL.md
function generateBlogContent(slug, title, cat, sections, body, frontmatter) {
  const whenBullets = extractWhenToUse(sections);
  const doNotUse = extractDoNotUse(sections);
  const links = categoryLinks[cat] || categoryLinks["Business Strategy"];

  let content = '';

  // Intro paragraph
  content += `The **${title}** skill by Benjamin Tate is one of 500+ AI-powered Claude Code skills designed to save you hours of manual work. `;
  content += `Whether you're a seasoned professional or just getting started, this skill generates a complete, ready-to-use ${title.toLowerCase()} `;
  content += `tailored to your specific business.\n\n`;

  // What it does
  content += `## What Does the ${title} Skill Do?\n\n`;
  content += (frontmatter.description || `Generates a professional ${title.toLowerCase()} customized to your needs.`) + '\n\n';

  // When to use
  if (whenBullets.length > 0) {
    content += `## When Should You Use This Skill?\n\n`;
    content += `This skill is perfect when you need to:\n\n`;
    whenBullets.forEach(b => { content += `- ${b}\n`; });
    content += '\n';
    if (doNotUse) content += `> **Note:** ${doNotUse}\n\n`;
  }

  // Key sections from the skill
  const keySections = Object.keys(sections).filter(s =>
    !['When to Use This Skill', 'Recovery', 'Anti-Patterns', 'Pre-Delivery Checklist'].includes(s)
  ).slice(0, 3);

  if (keySections.length > 0) {
    content += `## What's Included in the Output?\n\n`;
    content += `When you run \`/${slug}\` in Claude Code, you'll get a structured document covering:\n\n`;
    keySections.forEach(s => { content += `- **${s}** - with detailed frameworks and actionable guidance\n`; });
    content += '\n';
  }

  // Outbound links for SEO
  content += `## Learn More\n\n`;
  content += `For additional context on this topic, check out these resources:\n\n`;
  links.forEach(l => { content += `- [${l.text}](${l.url})\n`; });
  content += '\n';

  // CTA
  content += `## Get All 500+ Skills Free\n\n`;
  content += `The ${title} skill is part of the **Skills Ultimate Bundle** by Benjamin Tate — `;
  content += `a collection of 500+ AI-powered skills for Claude Code. Sign up for a free CloudCode account `;
  content += `to download and install the complete bundle.\n`;

  return content;
}

// Generate tags from content analysis
function generateTags(slug, cat, body) {
  const catTags = {
    "Marketing & Advertising": ["marketing","advertising","strategy"],
    "Sales & Revenue": ["sales","revenue","conversion"],
    "Content Creation": ["content","writing","copywriting"],
    "Email Marketing": ["email","automation","marketing"],
    "SEO & Technical": ["seo","technical","optimization"],
    "Brand & Design": ["branding","design","identity"],
    "Social Media": ["social-media","engagement","content"],
    "Legal & Compliance": ["legal","compliance","policy"],
    "Finance & Operations": ["finance","operations","planning"],
    "HR & Management": ["hr","management","team"],
    "Customer Experience": ["customer","experience","support"],
    "Events & Community": ["events","community","engagement"],
    "Product & Platform": ["product","platform","launch"],
    "Education & Learning": ["education","learning","training"],
    "Business Strategy": ["strategy","planning","business"],
    "Agency & Freelance": ["agency","freelance","consulting"],
    "Podcasts & Speaking": ["podcast","speaking","media"],
    "Real Estate": ["real-estate","property","investment"],
    "E-commerce": ["ecommerce","retail","sales"],
    "Food & Hospitality": ["food","hospitality","restaurant"],
    "Nonprofit": ["nonprofit","fundraising","social-impact"],
    "Wellness & Lifestyle": ["wellness","lifestyle","health"],
  };
  const baseTags = catTags[cat] || ["business","professional","productivity"];
  const slugParts = slug.split('-').filter(w => w.length > 2 && !["the","and","for","with"].includes(w));
  return [...new Set([...baseTags, ...slugParts.slice(0, 2)])];
}

// Main: Read all skills and generate data
console.log('Reading skill files from:', SKILLS_DIR);

let dirs;
try {
  dirs = fs.readdirSync(SKILLS_DIR).filter(d => {
    const skillPath = path.join(SKILLS_DIR, d, 'SKILL.md');
    return fs.existsSync(skillPath);
  });
} catch (err) {
  console.error('Could not read skills directory:', err.message);
  process.exit(1);
}

console.log(`Found ${dirs.length} skills`);

const skills = [];

dirs.forEach(slug => {
  const skillPath = path.join(SKILLS_DIR, slug, 'SKILL.md');
  const raw = fs.readFileSync(skillPath, 'utf8');
  const { frontmatter, body } = parseSkillMd(raw);
  const sections = extractSections(body);

  const cat = slugToCategory[slug] || "Other";
  const title = titleOverrides[slug] || slugToTitle(slug);
  const icon = categoryIcons[cat] || "Star";

  const skill = {
    slug,
    title,
    category: cat,
    icon,
    description: generateSeoDescription(slug, title, frontmatter, sections, body),
    whoItsFor: generateWhoItsFor(slug, cat, sections),
    benefits: generateBenefits(slug, title, sections, body),
    examplePrompt: `/${slug}`,
    exampleOutput: generateExampleOutput(slug, title, sections, body),
    blogContent: generateBlogContent(slug, title, cat, sections, body, frontmatter),
    tags: generateTags(slug, cat, body),
    author: "Benjamin Tate",
    outboundLinks: (categoryLinks[cat] || categoryLinks["Business Strategy"]),
  };

  skills.push(skill);
});

// Sort alphabetically
skills.sort((a, b) => a.slug.localeCompare(b.slug));

// Build categories export
const categoriesExport = {};
for (const [cat] of Object.entries(categoryMap)) {
  const count = skills.filter(s => s.category === cat).length;
  if (count > 0) {
    categoriesExport[cat] = { count, icon: categoryIcons[cat] || "Star" };
  }
}

// Generate output
const output = `// Auto-generated skills data - ${skills.length} skills from actual SKILL.md files
// Generated on ${new Date().toISOString()}
// Author: Benjamin Tate

const skills = ${JSON.stringify(skills, null, 2)};

export const categories = ${JSON.stringify(categoriesExport, null, 2)};

export default skills;
`;

const outPath = path.join(__dirname, 'skills.js');
fs.writeFileSync(outPath, output, 'utf8');
console.log(`Generated skills.js with ${skills.length} skills across ${Object.keys(categoriesExport).length} categories`);
console.log(`Output: ${outPath}`);
