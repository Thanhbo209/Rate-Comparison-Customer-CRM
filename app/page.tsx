import { Navbar } from "@/components/layout/navbar";
import { BRAND, Logo } from "@/components/shared/brand";
import Link from "next/link";
// import { ContactForm } from "@/components/contact-form";

const SHIPMENTS = [
  {
    id: "RD-48213",
    to: "Maple Street, Unit 4",
    status: "Out for delivery",
    eta: "2:40 PM",
    tone: "active",
  },
  {
    id: "RD-48207",
    to: "Harbor Road Warehouse",
    status: "At hub",
    eta: "4:15 PM",
    tone: "idle",
  },
  {
    id: "RD-48190",
    to: "Oak Avenue 18",
    status: "Delivered",
    eta: "11:05 AM",
    tone: "done",
  },
] as const;

const CHIP: Record<(typeof SHIPMENTS)[number]["tone"], string> = {
  active: "bg-chart-1/40 text-foreground",
  idle: "bg-muted text-muted-foreground",
  done: "bg-primary/10 text-primary",
};

const FEATURES = [
  {
    title: "One live shipment board",
    text: "See every order's status, driver and arrival time on one screen instead of calling around.",
  },
  {
    title: "Customer updates that send themselves",
    text: "Customers get a message at pickup, dispatch and delivery. Nobody on your team writes them.",
  },
  {
    title: "Easy delivery window changes",
    text: "Move a delivery to a new time and the customer is told straight away.",
  },
  {
    title: "Drivers and routes at a glance",
    text: "Assign orders to drivers and see which routes are running behind.",
  },
  {
    title: "Proof of delivery",
    text: "Drivers add a photo or signature at the door. It is saved on the order.",
  },
  {
    title: "Delay alerts",
    text: "Get flagged when a shipment falls behind, before the customer has to ask.",
  },
];

const STEPS = [
  { title: "Add your orders", text: "Upload a file or add orders one by one." },
  {
    title: "Assign drivers",
    text: "Group orders into routes and give each to a driver.",
  },
  {
    title: "Track and notify",
    text: "Follow every stop live while customers get updates.",
  },
  {
    title: "Confirm delivery",
    text: "Collect proof at the door and close the order.",
  },
];

const FAQ = [
  {
    q: "Do my customers need an account to track an order?",
    a: "No. Customers follow their order from the link in the message they receive.",
  },
  {
    q: "How are customers notified?",
    a: "By SMS or email, whichever you choose for each message.",
  },
  {
    q: "Can I bring in my existing orders?",
    a: "Yes. You can upload a spreadsheet or add orders manually.",
  },
  {
    q: "How long does setup take?",
    a: "Most teams add their drivers and first orders the same day.",
  },
  {
    q: "Is there a free plan?",
    a: "Creating an account is free. Contact us to talk about pricing for your order volume.",
  },
];

const primaryBtn =
  "inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const outlineBtn =
  "inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* ───────────── Hero ───────────── */}
        <section
          id="home"
          className="relative flex min-h-svh scroll-mt-28 items-center overflow-hidden px-6 pb-20 pt-32 sm:px-10"
        >
          {/* dotted route behind the content */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <path
              d="M-40 700 C 240 640, 300 420, 560 400 S 900 220, 1260 120"
              className="stroke-primary/25"
              strokeWidth="2.5"
              strokeDasharray="2 10"
              strokeLinecap="round"
            />
          </svg>

          <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="max-w-xl font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
                Know where every order is, and tell customers before they ask.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                {BRAND} gives dispatchers one live view of every shipment and
                sends customers the updates automatically.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={primaryBtn}>
                  Create free account
                </Link>
                <a href="#how-it-works" className={outlineBtn}>
                  See how it works
                </a>
              </div>
            </div>

            {/* Dispatch board */}
            <div className="relative pb-8">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between">
                  <p className="font-heading text-lg font-semibold">
                    Today&apos;s deliveries
                  </p>
                  <span className="text-sm text-muted-foreground">
                    3 orders
                  </span>
                </div>
                <ul className="mt-4 divide-y divide-border">
                  {SHIPMENTS.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{s.id}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {s.to}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${CHIP[s.tone]}`}
                        >
                          {s.status}
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.eta}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What the customer receives */}
              <div className="absolute -bottom-2 -left-2 max-w-60 rounded-2xl rounded-bl-sm bg-primary p-3.5 text-sm leading-snug text-primary-foreground shadow-lg sm:-left-8">
                Your order RD-48213 is out for delivery. Arriving around 2:40
                PM.
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── Features ───────────── */}
        <section id="features" className="scroll-mt-28 px-6 py-24 sm:px-10">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.8fr_1.4fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Built for the people moving orders and the people answering
                about them
              </h2>
              <p className="mt-5 max-w-sm text-muted-foreground">
                Dispatch and customer support work from the same live
                information, so everyone gives the same answer.
              </p>
            </div>

            <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="border-t border-border py-6">
                  <h3 className="font-heading text-lg font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── How it works ───────────── */}
        <section
          id="how-it-works"
          className="scroll-mt-28 bg-muted/60 px-6 py-24 sm:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-xl font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              From first order to delivered in four steps
            </h2>

            <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  {/* connector line between steps */}
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-14 right-0 top-5 hidden border-t-2 border-dotted border-primary/30 lg:block"
                    />
                  )}
                  <span className="relative flex size-10 items-center justify-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-60 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────────── FAQ ───────────── */}
        <section id="faq" className="scroll-mt-28 px-6 py-24 sm:px-10">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.4fr]">
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Common questions
            </h2>

            <div className="divide-y divide-border border-y border-border">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                    >
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </summary>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── Contact ─────────────
        <section id="contact" className="scroll-mt-28 px-4 pb-20 sm:px-8">
          <div className="mx-auto grid max-w-6xl items-center gap-12 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-14 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                See it with your own orders
              </h2>
              <p className="mt-5 max-w-md text-primary-foreground/80">
                Tell us a little about your deliveries and we&apos;ll set up a short walkthrough
                using your routes.
              </p>
            </div>

            <div className="rounded-2xl bg-background p-6 text-foreground sm:p-8">
              <ContactForm />
            </div>
          </div>
        </section> */}
      </main>

      {/* ───────────── Footer ───────────── */}
      <footer className="border-t border-border px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-primary">
            <Logo size={24} />
            <span className="font-heading font-semibold text-foreground">
              {BRAND}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRAND}. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-muted-foreground hover:text-foreground"
            >
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
