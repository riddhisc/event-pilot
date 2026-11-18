import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import { BarChart3, CalendarDays, Network, Workflow } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useUiStore } from '../stores/uiStore';
import { IconButton } from '../components/ui/kit';

const LandingPage = () => {
  const { push } = useToast();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [sent, setSent] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    document.title = 'Event Pilot';
    const onScroll = () => setShowTopButton(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="logo">
          <img src="/logo.svg" alt="" width="36" height="36" />
          <span>Event Pilot</span>
        </Link>
        <nav aria-label="Landing" className="form-actions">
          <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
          <Link className="btn btn-ghost" to="/login">Sign in</Link>
        </nav>
      </header>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Workplace events</p>
          <h1>Office events your whole company can actually use</h1>
          <p>Plan gatherings, collect RSVPs, and give each company its own workspace.</p>
          <a className="btn" href="#request-demo">Get started</a>
        </div>
        <div className="product-mock" aria-hidden="true">
          <article className="card"><strong>Upcoming</strong><p>Quarterly Product Summit</p><p>48 going</p></article>
          <article className="card"><strong>RSVP</strong><p>Going · Maybe · Can't go</p></article>
          <article className="card"><strong>Onboarding</strong><p>Northwind Offices · 72%</p></article>
        </div>
      </section>
      <section className="feature-section" aria-labelledby="feature-title">
        <div className="section-intro"><p className="eyebrow">One workspace</p><h2 id="feature-title">Everything teams need to gather well.</h2></div>
        <div className="feature-list">
          <article className="feature-item"><CalendarDays aria-hidden="true" /><div><h3>Events</h3><p>Publish in-person, virtual, and hybrid events with capacity and waitlists.</p></div></article>
          <article className="feature-item"><BarChart3 aria-hidden="true" /><div><h3>Analytics</h3><p>See participation, feedback, and department engagement.</p></div></article>
          <article className="feature-item"><Network aria-hidden="true" /><div><h3>Networking</h3><p>Suggest colleagues from shared departments, interests, and events.</p></div></article>
          <article className="feature-item"><Workflow aria-hidden="true" /><div><h3>Onboarding & setup</h3><p>Connect tools and roll configuration back without losing history.</p></div></article>
        </div>
      </section>
      <section className="process-section" aria-labelledby="process-title">
        <div className="section-intro"><p className="eyebrow">A simple rhythm</p><h2 id="process-title">How it works</h2></div>
        <div className="process-list">
          <article className="process-step"><span>01</span><h3>Request a workspace</h3><p>Tell us the company name and who should administer it.</p></article>
          <article className="process-step"><span>02</span><h3>Import people</h3><p>Bring staff in, connect the calendar, and publish a first event.</p></article>
          <article className="process-step"><span>03</span><h3>Run the gathering</h3><p>RSVPs, reminders, check-in, and a short feedback loop.</p></article>
        </div>
      </section>
      <section className="proof-section">
        <p className="eyebrow">Teams using Event Pilot</p>
        <div className="chip-row">
          <span className="chip">Northwind Offices</span>
          <span className="chip">Contoso Labs</span>
          <span className="chip">Studio teams</span>
        </div>
        <blockquote>“People actually RSVP now, and we can see which departments show up.”</blockquote>
      </section>
      <section className="demo-section" id="request-demo">
        <div className="section-intro"><p className="eyebrow">See it in action</p><h2>Request a demo</h2><p>Tell us where your team is today. We’ll show you the shortest path to a better gathering.</p></div>
        {sent ? <p role="status">Thanks. We will reply to {form.email}.</p> : (
          <form className="demo-form" onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
            push({ title: 'Demo request sent' });
          }}>
            <label htmlFor="demo-name">Name</label>
            <input id="demo-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <label htmlFor="demo-email">Work email</label>
            <input id="demo-email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <label htmlFor="demo-company">Company</label>
            <input id="demo-company" required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            <button className="btn" type="submit">Submit</button>
          </form>
        )}
      </section>
      <section className="faq-section">
        <div className="section-intro"><p className="eyebrow">Questions</p><h2>FAQ</h2></div>
        <div className="faq">
          <details><summary>Does each company stay separate?</summary><p>Yes. People, events, and integrations belong to one tenant.</p></details>
          <details><summary>Can we try it without a real directory?</summary><p>Demo accounts are available in local development.</p></details>
          <details><summary>What is the setup console?</summary><p>It is the onboarding workspace for connecting a new company.</p></details>
        </div>
      </section>
      {showTopButton && (
        <button
          type="button"
          className="go-top-button"
          aria-label="Go to top"
          title="Go to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
