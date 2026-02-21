import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold text-slate-900">Reservas Chanantes</span>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/admin/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative mx-auto max-w-6xl px-6 pb-24 pt-16"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left */}
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Online bookings,{' '}
              <span className="text-indigo-600">made simple</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-lg">
              Create your booking page in minutes. Share the link, and let your
              customers book appointments 24/7 — no phone calls needed.
            </p>
            <Link
              href="/admin/register"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Get Started Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Right — decorative mock widget */}
          <div className="hidden md:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Book an appointment</p>
                  <p className="text-sm text-slate-500">Choose a service to get started</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50/50 p-4">
                  <p className="font-medium text-slate-900">Haircut</p>
                  <p className="text-sm text-slate-500">30 min &middot; 15,00&nbsp;&euro;</p>
                </div>
                <div className="rounded-xl border-2 border-slate-200 p-4">
                  <p className="font-medium text-slate-900">Beard trim</p>
                  <p className="text-sm text-slate-500">20 min &middot; 10,00&nbsp;&euro;</p>
                </div>
                <div className="rounded-xl border-2 border-slate-200 p-4">
                  <p className="font-medium text-slate-900">Full styling</p>
                  <p className="text-sm text-slate-500">60 min &middot; 35,00&nbsp;&euro;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              ),
              title: 'Create your page',
              desc: 'Register, add your services, and get a shareable booking link instantly.',
            },
            {
              icon: (
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              ),
              title: 'Set your schedule',
              desc: 'Define your availability day by day. Block off time when you\'re busy.',
            },
            {
              icon: (
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              ),
              title: 'Customers book 24/7',
              desc: 'Your customers pick a time that works — day or night, no phone tag.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Reservas Chanantes
      </footer>
    </div>
  )
}
