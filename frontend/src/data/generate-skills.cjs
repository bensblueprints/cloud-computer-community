const fs = require('fs');
const path = require('path');

// All skill slugs
const allSlugs = [
  "ab-test-plan","abandoned-cart-email","about-page","accessibility-policy","ad-creative-brief","ad-performance-report","ad-spend-calculator","affiliate-program","affiliate-recruitment","affiliate-terms","agency-onboarding","ai-content-policy","ai-ethics-policy","ai-use-case-finder","ambassador-program","analytics-setup-guide","annual-planning","annual-report-writer","annual-review","api-documentation","article-rewriter","attribution-model","author-platform-plan","authority-content-strategy","automation-workflow","award-application","batch-processing-system","benchmarking-report","benefits-guide","beta-launch-plan","black-friday-emails","blog-post","book-outline","book-proposal","bookkeeping-setup","brand-architecture","brand-audit","brand-identity-guide","brand-photography-brief","brand-positioning-statement","brand-refresh","brand-story","brand-tagline","brand-voice-guide","breakeven-analysis","budget-planner","bundle-creator","business-continuity-plan","business-plan","caption-writer","cart-recovery-sms","case-study","cash-flow-forecast","catering-proposal","cause-marketing-campaign","cease-and-desist","certification-program","change-management-plan","chatbot-script","checkout-optimizer","churn-analysis","churn-prevention-playbook","class-schedule-planner","client-agreement","client-crm","client-feedback-system","client-intake-form","client-report-template","client-transformation-story","co-marketing-plan","coaching-framework","cohort-analysis","cohort-program","cold-outreach","collaboration-agreement","collection-page-copy","color-palette-generator","commission-structure","community-launch","community-moderation","comparison-article","compensation-plan","competitor-analysis","complaint-resolution","compliance-checklist","conference-planner","consulting-framework","consulting-proposal-template","content-audit","content-brief","content-calendar","content-cluster-plan","content-gap-finder","content-pillar-strategy","content-repurpose","content-style-guide","continuing-education","contract-writer","contractor-brief","conversion-funnel-analysis","cookie-policy","copyright-notice","cost-analysis","course-outline","crisis-comms","cross-border-selling","cross-sell-strategy","culture-document","curriculum-review","customer-advisory-board","customer-health-score","customer-journey-map","customer-lifetime-value","customer-persona","customer-review-strategy","customer-segmentation","customer-success-playbook","customer-support-kb","customer-win-story","data-collection-plan","data-dashboard-design","data-processing-agreement","decision-matrix","delegation-framework","diagnostic-assessment","digital-product-plan","disclaimer-generator","discount-strategy","discovery-call-script","diversity-policy","donation-page-copy","downsell-sequence","drip-campaign","dropshipping-supplier-brief","ebook-outline","email-ab-test-plan","email-deliverability-audit","email-design-system","email-list-cleanup","email-newsletter-template","email-preference-center","email-sequence","email-subject-line-tester","employee-handbook","employee-survey","energy-management","engagement-playbook","escalation-procedure","event-budget-planner","event-follow-up","event-marketing-plan","event-planner","event-registration-page","event-run-of-show","event-sponsorship-proposal","exchange-policy","executive-resume","exit-interview-template","expense-policy","expense-tracker","expert-positioning","expert-roundup-pitch","facebook-ad-campaign","facebook-group-plan","faq-generator","feature-announcement","feature-request-system","featured-snippet-optimizer","feedback-analysis","financial-dashboard","financial-model","financial-projection","fitness-program-outline","flash-sale-campaign","food-delivery-strategy","food-photography-brief","food-truck-business-plan","freelance-rate-card","freelancer-management","fulfillment-sop","fundraising-tracker","gdpr-compliance-checklist","ghostwriter-brief","gift-guide","google-ads-campaign","google-business-profile","grant-application","grant-report","group-program-design","guest-post-pitch","hashtag-strategy","headline-generator","health-disclaimer","help-center-article","high-ticket-sales-page","hiring-scorecard","homework-assignment","hook-generator","hybrid-event-plan","icon-set-brief","impact-report","independent-contractor-agreement","industry-association-plan","influencer-campaign-brief","influencer-outreach","instagram-carousel","intellectual-property-audit","interview-question-bank","inventory-management","investment-property-analysis","investor-update","invoice-template","job-posting","joint-venture-proposal","keyword-research","knowledge-base-builder","kpi-dashboard","landing-page-audit","landing-page-copy","launch-assets","launch-checklist","launch-email-sequence","lead-magnet","learning-path","lease-agreement-checklist","lesson-plan","letter-of-intent","licensing-agreement","link-building-plan","linkedin-ad-campaign","linkedin-article","linkedin-profile-optimizer","linkedin-strategy","listicle-generator","local-seo-plan","lookalike-audience-plan","loyalty-program","market-research","market-sizing","marketplace-fee-structure","marketplace-launch-plan","marketplace-listing","marketplace-metrics","marketplace-seo","mastermind-group","media-buy-plan","media-kit","meeting-agenda","meeting-notes","membership-site-plan","meme-content-brief","mentorship-program","menu-design-brief","merch-design-brief","meta-tag-optimizer","metric-definition-guide","micro-course","microcopy-writer","milestone-email","mission-statement","morning-routine-builder","naming-workshop","nda-template","neighborhood-guide","networking-event-plan","networking-strategy","newsletter-builder","newsletter-strategy","no-code-app-plan","non-compete-agreement","nonprofit-board-packet","nonprofit-fundraising-letter","nps-survey","nutrition-content-plan","objection-handler","offboarding-checklist","offer-letter","okr-builder","onboarding-checklist","onboarding-flow","one-on-one-template","open-house-plan","order-bump-copy","packaging-brief","partnership-agreement","partnership-proposal","payment-plan-offer","payment-terms-policy","performance-review","personal-brand-strategy","pillar-page","pinterest-strategy","pip-template","pitch-deck","platform-community-guidelines","platform-help-center","platform-migration","platform-partnership","platform-trust-system","podcast-ad-script","podcast-guest-pitch","podcast-launch","podcast-one-sheet","podcast-show-notes","portfolio-page","pr-pitch","presentation-template-guide","press-kit","press-release","price-increase-notice","pricing-analysis","pricing-calculator","pricing-page-copy","pricing-strategy","privacy-policy","process-automation-audit","product-changelog","product-comparison","product-description","product-faq","product-feedback-loop","product-hunt-launch","product-launch-email","product-launch-plan","product-listing-optimizer","product-photography-brief","product-recall-plan","product-roadmap","product-sourcing-brief","professional-bio","profit-loss-report","project-scope-change","project-tracker","prompt-library","property-listing","property-management-sop","proposal-writer","quality-assurance-checklist","quarterly-review","quiz-generator","rate-negotiation-script","re-engagement-email","real-estate-crm-setup","real-estate-newsletter","rebrand-plan","recipe-card","reddit-strategy","referral-bonus-plan","referral-program","release-notes","remote-team-handbook","remote-work-policy","renewal-campaign","rental-listing","report-automation","restaurant-marketing-plan","restaurant-review-response","restaurant-sop","retainer-agreement","retargeting-strategy","retreat-planner","retrospective","return-policy","revenue-forecast","revenue-model","review-response","risk-assessment","roi-calculator","saas-agreement","saas-cancellation-flow","saas-evaluation","saas-metrics-dashboard","saas-onboarding-flow","sales-battlecard","sales-deck","sales-email-template","sales-funnel-builder","sales-page","sales-script","satisfaction-survey","schema-markup-guide","scope-of-work","script-to-blog","seasonal-campaign","seasonal-inventory-plan","seasonal-menu-plan","self-service-portal","seller-onboarding","sentiment-analysis","seo-audit","seo-competitor-analysis","seo-content-brief","seo-migration-plan","seo-reporting-template","service-guarantee","service-level-agreement","service-productization","service-recovery-plan","shipping-policy","short-form-video-plan","signage-brief","signature-talk","site-architecture-plan","size-guide","skill-assessment","social-impact-measurement","social-listening-plan","social-media-audit","social-media-calendar","social-media-graphics","social-media-policy","social-media-strategy","social-proof-collector","sop-builder","speaker-outreach","speaking-one-sheet","speaking-proposal","speech-writer","sponsor-pitch","sponsor-thank-you","status-update-template","store-launch-plan","store-page-audit","strategic-alliance-plan","student-feedback-form","study-guide","style-tile","subcontractor-agreement","subscription-box-plan","subscription-metrics","succession-plan","supplement-disclaimer","support-response-templates","survey-analysis","survey-builder","swot-analysis","task-prioritization","tax-deduction-finder","tax-prep-checklist","team-building-plan","team-charter","tech-stack-recommendation","technical-seo-checklist","ted-talk-outline","tenant-screening-checklist","terms-of-service","terms-of-use-app","testimonial-collector","thank-you-campaign","thought-leader-content-plan","thought-leadership","thread-hook-writer","tiktok-ad-script","tiktok-script","time-audit","tool-stack-audit","trademark-application","training-manual","training-plan","transactional-email","trial-to-paid-email","tripwire-offer","tutorial-writer","twitter-thread","two-sided-email-strategy","unboxing-experience","unit-economics","upsell-sequence","user-generated-content","user-research-plan","value-proposition-canvas","vendor-evaluation","vendor-onboarding","video-script","viral-content-formula","virtual-event-platform","visual-identity-brief","voice-of-customer","volunteer-recruitment","waitlist-builder","waiver-release","webinar-email-sequence","webinar-planner","webinar-sales-script","weekly-report","welcome-sequence","wellness-assessment","wellness-workshop-plan","white-paper","wholesale-catalog","win-back-campaign","win-loss-analysis","workflow-mapper","workplace-policy","workshop-builder","workshop-handout","youtube-ad-script","youtube-seo","youtube-strategy","youtube-thumbnail"
];

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
  "Other": ["about-page","affiliate-program","affiliate-recruitment","affiliate-terms","ai-use-case-finder","automation-workflow","cohort-analysis","contract-writer","crisis-comms","data-collection-plan","data-dashboard-design","engagement-playbook","executive-resume","expert-positioning","expert-roundup-pitch","guest-post-pitch","industry-association-plan","membership-site-plan","metric-definition-guide","portfolio-page","pr-pitch","presentation-template-guide","press-release","price-increase-notice","process-automation-audit","professional-bio","property-listing","quality-assurance-checklist","quiz-generator","sop-builder","service-productization","sponsor-pitch","sponsor-thank-you","survey-analysis","survey-builder","tool-stack-audit","vendor-evaluation","vendor-onboarding","waitlist-builder","workflow-mapper","user-research-plan"]
};

// Reverse map: slug -> category
const slugToCategory = {};
for (const [cat, slugs] of Object.entries(categoryMap)) {
  for (const s of slugs) slugToCategory[s] = cat;
}

// Icon mapping by category
const categoryIcons = {
  "Marketing & Advertising": "Megaphone",
  "Sales & Revenue": "TrendingUp",
  "Content Creation": "PenTool",
  "Email Marketing": "Mail",
  "SEO & Technical": "Search",
  "Brand & Design": "Palette",
  "Social Media": "Share2",
  "Legal & Compliance": "Shield",
  "Finance & Operations": "DollarSign",
  "HR & Management": "Users",
  "Customer Experience": "Heart",
  "Events & Community": "Calendar",
  "Product & Platform": "Package",
  "Education & Learning": "BookOpen",
  "Business Strategy": "Briefcase",
  "Agency & Freelance": "Briefcase",
  "Podcasts & Speaking": "Mic",
  "Real Estate": "Home",
  "E-commerce": "Package",
  "Food & Hospitality": "Award",
  "Nonprofit": "Heart",
  "Wellness & Lifestyle": "Zap",
  "Other": "Star"
};

// Detailed descriptions for each skill
const skillDetails = {
  "ab-test-plan": { title: "A/B Test Plan Generator", desc: "Create structured A/B testing plans with hypotheses, success metrics, sample sizes, and statistical significance thresholds. Ensure every experiment delivers actionable insights.", who: ["Marketing managers","Growth hackers","Product managers","CRO specialists"], benefits: ["Eliminate guesswork from optimization decisions","Calculate exact sample sizes needed for statistical significance","Structure tests to produce clear, actionable winners"], output: "A complete A/B test plan including hypothesis statement, control vs. variant descriptions, primary and secondary metrics, required sample size calculations, test duration estimate, and a decision framework for interpreting results.", tags: ["marketing","testing","optimization","data"] },
  "abandoned-cart-email": { title: "Abandoned Cart Email Writer", desc: "Generate high-converting abandoned cart email sequences that recover lost revenue. Includes timing strategy, subject lines, and persuasive copy with urgency triggers.", who: ["E-commerce store owners","Email marketers","Shopify merchants","DTC brands"], benefits: ["Recover 10-15% of abandoned carts with proven email sequences","Create multi-touch sequences with escalating urgency","Personalize messaging based on cart value and products"], output: "A 3-email abandoned cart sequence with optimized send timing (1 hour, 24 hours, 72 hours), subject lines with A/B variants, personalized body copy, product image placeholders, discount escalation strategy, and CTA buttons.", tags: ["email","ecommerce","recovery","conversion"] },
  "about-page": { title: "About Page Writer", desc: "Craft compelling About pages that build trust, tell your brand story, and convert visitors into customers. Combines storytelling with strategic positioning.", who: ["Business owners","Website designers","Startups","Personal brands"], benefits: ["Build instant credibility with visitors through authentic storytelling","Convert more visitors by establishing trust and authority","Communicate your unique value proposition clearly"], output: "A complete About page with hero section copy, brand origin story, mission statement, team bios framework, social proof placement, values section, and a compelling call-to-action.", tags: ["website","copywriting","branding","trust"] },
  "accessibility-policy": { title: "Accessibility Policy Generator", desc: "Generate ADA and WCAG-compliant accessibility policies for websites and applications. Covers all required disclosures and commitment statements.", who: ["Web developers","Legal teams","Compliance officers","Business owners"], benefits: ["Ensure legal compliance with ADA and WCAG 2.1 standards","Demonstrate commitment to inclusive design","Reduce legal risk from accessibility lawsuits"], output: "A comprehensive accessibility policy covering WCAG conformance level, assistive technology compatibility, known limitations, feedback mechanisms, and remediation timeline.", tags: ["legal","compliance","accessibility","web"] },
  "ad-creative-brief": { title: "Ad Creative Brief Builder", desc: "Build detailed creative briefs for advertising campaigns across platforms. Defines target audience, messaging hierarchy, visual direction, and performance goals.", who: ["Creative directors","Media buyers","Marketing agencies","Brand managers"], benefits: ["Align creative teams on campaign objectives and brand guidelines","Reduce revision cycles with clear upfront direction","Ensure ad creative resonates with target audience segments"], output: "A structured creative brief including campaign objective, target audience profile, key message and supporting points, tone of voice guidelines, visual references, platform specs, and success metrics.", tags: ["advertising","creative","campaign","brief"] },
  "ad-performance-report": { title: "Ad Performance Report Template", desc: "Generate professional ad performance reports with KPI dashboards, trend analysis, and optimization recommendations. Covers all major ad platforms.", who: ["Media buyers","PPC managers","Marketing agencies","CMOs"], benefits: ["Present campaign results in a clear, professional format","Identify optimization opportunities from performance data","Automate monthly reporting with consistent templates"], output: "A detailed performance report template with executive summary, spend breakdown by platform/campaign, KPI scorecards (CTR, CPC, ROAS, CPA), trend charts, audience insights, and next-period recommendations.", tags: ["advertising","analytics","reporting","performance"] },
  "ad-spend-calculator": { title: "Ad Spend Calculator & Planner", desc: "Calculate optimal advertising budgets based on your goals, industry benchmarks, and expected returns. Plan media allocation across channels.", who: ["Marketing managers","Startup founders","Media planners","CFOs"], benefits: ["Allocate budget optimally across advertising channels","Forecast expected results based on industry benchmarks","Prevent overspending with data-driven budget guardrails"], output: "A budget allocation plan with recommended spend per channel, projected impressions/clicks/conversions, expected CPA and ROAS by platform, monthly pacing schedule, and break-even analysis.", tags: ["advertising","budget","planning","calculator"] },
};

// Helper to generate title from slug
function slugToTitle(slug) {
  const overrides = {
    "ab-test-plan": "A/B Test Plan Generator",
    "api-documentation": "API Documentation Writer",
    "ai-content-policy": "AI Content Policy Generator",
    "ai-ethics-policy": "AI Ethics Policy Framework",
    "ai-use-case-finder": "AI Use Case Finder",
    "cta": "CTA Optimizer",
    "crm": "CRM Setup Guide",
    "diy": "DIY Guide Creator",
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
  if (overrides[slug]) return overrides[slug];
  return slug.split('-').map(w => {
    if (["a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","as","is","was","are","be"].includes(w) && slug.split('-').indexOf(w) > 0) return w;
    if (w === "sms") return "SMS";
    if (w === "crm") return "CRM";
    if (w === "sop") return "SOP";
    if (w === "b2b") return "B2B";
    if (w === "ab") return "A/B";
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

// Generate description from slug and category
function genDesc(slug, title, cat) {
  const patterns = {
    "Marketing & Advertising": `Generate a comprehensive ${title.toLowerCase()} tailored to your business goals and target audience. Includes actionable strategies, metrics to track, and implementation timeline.`,
    "Sales & Revenue": `Create a professional ${title.toLowerCase()} designed to increase conversions and revenue. Features proven frameworks, persuasive copy structures, and measurable objectives.`,
    "Content Creation": `Build a complete ${title.toLowerCase()} with strategic frameworks, audience-optimized messaging, and SEO considerations. Produces publish-ready content structures.`,
    "Email Marketing": `Design a high-performing ${title.toLowerCase()} with optimized subject lines, send timing, segmentation strategy, and conversion-focused copy.`,
    "SEO & Technical": `Generate a thorough ${title.toLowerCase()} covering on-page optimization, technical factors, competitive gaps, and prioritized action items.`,
    "Brand & Design": `Create a polished ${title.toLowerCase()} that defines your visual and verbal identity with clear guidelines, mood references, and consistency rules.`,
    "Social Media": `Build a strategic ${title.toLowerCase()} with platform-specific tactics, content themes, posting schedules, and engagement strategies.`,
    "Legal & Compliance": `Generate a professional ${title.toLowerCase()} covering all required legal disclosures, regulatory standards, and protective clauses.`,
    "Finance & Operations": `Create a detailed ${title.toLowerCase()} with accurate calculations, projections, and data-driven insights for informed decision-making.`,
    "HR & Management": `Build a comprehensive ${title.toLowerCase()} with best-practice structures, clear policies, and implementation guidance.`,
    "Customer Experience": `Design a customer-focused ${title.toLowerCase()} with journey mapping, feedback loops, and retention strategies that increase satisfaction.`,
    "Events & Community": `Plan a successful ${title.toLowerCase()} with logistics, engagement activities, promotion strategies, and post-event follow-up.`,
    "Product & Platform": `Create a strategic ${title.toLowerCase()} covering feature priorities, user flows, technical requirements, and launch milestones.`,
    "Education & Learning": `Build an effective ${title.toLowerCase()} with learning objectives, structured curriculum, assessment methods, and engagement techniques.`,
    "Business Strategy": `Generate a strategic ${title.toLowerCase()} with market analysis, competitive positioning, resource planning, and measurable milestones.`,
    "Agency & Freelance": `Create a professional ${title.toLowerCase()} with clear deliverables, timelines, pricing structures, and client communication frameworks.`,
    "Podcasts & Speaking": `Build a compelling ${title.toLowerCase()} with audience hooks, structured talking points, and promotional assets.`,
    "Real Estate": `Generate a professional ${title.toLowerCase()} with market analysis, property details, compliance requirements, and marketing strategies.`,
    "E-commerce": `Create a conversion-optimized ${title.toLowerCase()} with product strategies, customer experience enhancements, and growth tactics.`,
    "Food & Hospitality": `Build a professional ${title.toLowerCase()} covering menu strategy, customer experience, operations, and marketing.`,
    "Nonprofit": `Create an impactful ${title.toLowerCase()} with compelling narratives, donor engagement strategies, and measurable outcomes.`,
    "Wellness & Lifestyle": `Design a personalized ${title.toLowerCase()} with evidence-based approaches, progress tracking, and sustainable habits.`,
    "Other": `Generate a professional ${title.toLowerCase()} with structured frameworks, actionable steps, and measurable outcomes.`
  };
  return patterns[cat] || patterns["Other"];
}

// Generate who-its-for based on category
function genWho(cat) {
  const whoMap = {
    "Marketing & Advertising": ["Marketing managers","Growth marketers","Agency owners","CMOs"],
    "Sales & Revenue": ["Sales managers","Founders","Revenue leaders","Sales reps"],
    "Content Creation": ["Content marketers","Bloggers","Copywriters","Brand managers"],
    "Email Marketing": ["Email marketers","E-commerce owners","Marketing managers","Growth hackers"],
    "SEO & Technical": ["SEO specialists","Content strategists","Web developers","Marketing managers"],
    "Brand & Design": ["Brand managers","Designers","Founders","Creative directors"],
    "Social Media": ["Social media managers","Content creators","Influencers","Brand managers"],
    "Legal & Compliance": ["Business owners","Legal teams","Compliance officers","Founders"],
    "Finance & Operations": ["CFOs","Business owners","Operations managers","Accountants"],
    "HR & Management": ["HR managers","Team leads","Business owners","Operations directors"],
    "Customer Experience": ["Customer success managers","Support leads","Product managers","CX directors"],
    "Events & Community": ["Event planners","Community managers","Marketing managers","Founders"],
    "Product & Platform": ["Product managers","Founders","CTOs","Development leads"],
    "Education & Learning": ["Educators","Course creators","Training managers","Coaches"],
    "Business Strategy": ["CEOs","Founders","Strategy consultants","Business analysts"],
    "Agency & Freelance": ["Agency owners","Freelancers","Consultants","Project managers"],
    "Podcasts & Speaking": ["Podcast hosts","Public speakers","Thought leaders","Content creators"],
    "Real Estate": ["Real estate agents","Property managers","Investors","Brokers"],
    "E-commerce": ["E-commerce owners","Shopify merchants","DTC brands","Marketplace sellers"],
    "Food & Hospitality": ["Restaurant owners","Chefs","Food entrepreneurs","Hospitality managers"],
    "Nonprofit": ["Nonprofit directors","Fundraisers","Grant writers","Board members"],
    "Wellness & Lifestyle": ["Coaches","Wellness practitioners","Entrepreneurs","Fitness professionals"],
    "Other": ["Business owners","Professionals","Entrepreneurs","Managers"]
  };
  return whoMap[cat] || whoMap["Other"];
}

// Generate benefits
function genBenefits(slug, title, cat) {
  return [
    `Save hours by generating a professional ${title.toLowerCase()} in seconds instead of starting from scratch`,
    `Follow proven frameworks and best practices used by industry leaders`,
    `Get a customized, ready-to-use deliverable tailored to your specific business and audience`
  ];
}

// Generate example output
function genOutput(slug, title, cat) {
  return `A complete, professionally structured ${title.toLowerCase()} customized to your business, including all necessary sections, actionable recommendations, and implementation steps ready to put into practice immediately.`;
}

// Generate tags
function genTags(slug, cat) {
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
    "Other": ["business","professional","productivity"]
  };
  const baseTags = catTags[cat] || catTags["Other"];
  // Add slug-derived tags
  const slugParts = slug.split('-').filter(w => w.length > 2 && !["the","and","for","with"].includes(w));
  const extra = slugParts.slice(0, 2);
  return [...new Set([...baseTags, ...extra])];
}

// Build all skills
const skills = allSlugs.map(slug => {
  const cat = slugToCategory[slug] || "Other";
  const title = skillDetails[slug]?.title || slugToTitle(slug);
  const desc = skillDetails[slug]?.desc || genDesc(slug, title, cat);
  const who = skillDetails[slug]?.who || genWho(cat);
  const benefits = skillDetails[slug]?.benefits || genBenefits(slug, title, cat);
  const output = skillDetails[slug]?.output || genOutput(slug, title, cat);
  const tags = skillDetails[slug]?.tags || genTags(slug, cat);
  const icon = categoryIcons[cat] || "Star";

  return {
    slug,
    title,
    category: cat,
    icon,
    description: desc,
    whoItsFor: who,
    benefits,
    examplePrompt: `/${slug}`,
    exampleOutput: output,
    tags
  };
});

// Build categories export
const categoriesExport = {};
for (const [cat, slugs] of Object.entries(categoryMap)) {
  categoriesExport[cat] = {
    count: slugs.length,
    icon: categoryIcons[cat] || "Star"
  };
}

// Generate output
const output = `// Auto-generated skills data - ${skills.length} skills
// Generated on ${new Date().toISOString()}

const skills = ${JSON.stringify(skills, null, 2)};

export const categories = ${JSON.stringify(categoriesExport, null, 2)};

export default skills;
`;

fs.writeFileSync(path.join(__dirname, 'skills.js'), output, 'utf8');
console.log(`Generated skills.js with ${skills.length} skills across ${Object.keys(categoriesExport).length} categories`);
