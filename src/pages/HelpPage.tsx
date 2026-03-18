/**
 * Help & Onboarding Page
 */
export function HelpPage() {
  const faqs = [
    {
      q: "How is my activity tracked?",
      a: "Activity is tracked at the domain level only. We never collect URL paths, query parameters, or content of your work. All data is aggregated for privacy.",
    },
    {
      q: "What does my productivity score mean?",
      a: "Your productivity score is calculated based on active work time vs idle time. It is meant to help identify patterns, not to monitor individual actions.",
    },
    {
      q: "How often is data updated?",
      a: "The dashboard uses polling to refresh data every 30 seconds. This is near-real-time, not live streaming.",
    },
    {
      q: "Can I see my own data?",
      a: "Yes. Employees can view their own historical activity, sessions, and reports in their scoped pages.",
    },
  ];

  const quickStart = [
    {
      title: "1. Connect",
      desc: "Join the Pi-Gateway network to register your device.",
      icon: "wifi",
    },
    {
      title: "2. Authenticate",
      desc: "Sign in through the captive portal to activate monitoring.",
      icon: "login",
    },
    {
      title: "3. Work",
      desc: "Your activity is automatically tracked for analytics and insights.",
      icon: "monitoring",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 section-title">
          <span className="material-symbols-outlined text-[24px] text-blue-500">help_outline</span>
          Help and Onboarding
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get started with Workforce Analytics</p>
      </div>

      {/* Quick Start */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Quick Start Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStart.map((step) => (
            <div key={step.title} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-5 text-center">
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[24px] text-blue-600 dark:text-blue-400">
                  {step.icon}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{step.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Frequently Asked Questions</h3>
        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg group"
            >
              <summary className="flex items-center gap-2.5 px-4 py-3.5 cursor-pointer text-sm font-semibold text-slate-900 dark:text-white select-none list-none [&::-webkit-details-marker]:hidden">
                <span className="material-symbols-outlined text-[18px] text-blue-500 shrink-0 transition-transform group-open:rotate-90">
                  chevron_right
                </span>
                {faq.q}
              </summary>
              <p className="text-sm text-slate-500 dark:text-slate-400 px-4 pb-4 pl-10 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
