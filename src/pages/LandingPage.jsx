import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useUiStore } from '../stores/uiStore';
import { IconButton } from '../components/ui/kit';

const LandingPage = () => {
  const { push } = useToast();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = 'EventBuddy';
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="logo">
          <img src="/logo.svg" alt="" width="36" height="36" />
          <span>EventBuddy</span>
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
      <section className="features-grid">
        <article className="card"><h2>Events</h2><p>Publish in-person, virtual, and hybrid events with capacity and waitlists.</p></article>
        <article className="card"><h2>Analytics</h2><p>See participation, feedback, and department engagement.</p></article>
        <article className="card"><h2>Networking</h2><p>Suggest colleagues from shared departments, interests, and events.</p></article>
        <article className="card"><h2>Onboarding & setup console</h2><p>Onboard a company, connect tools, and roll configuration back.</p></article>
      </section>
      <section className="features-grid">
        <h2>How it works</h2>
        <article className="card"><h3>1. Request a workspace</h3><p>Tell us the company name and who should administer it.</p></article>
        <article className="card"><h3>2. Import people</h3><p>Bring staff in, connect the calendar, and publish a first event.</p></article>
        <article className="card"><h3>3. Run the gathering</h3><p>RSVPs, reminders, check-in, and a short feedback loop.</p></article>
      </section>
      <section className="features-grid">
        <p className="eyebrow">Teams using EventBuddy</p>
        <div className="chip-row">
          <span className="chip">Northwind Offices</span>
          <span className="chip">Contoso Labs</span>
          <span className="chip">Studio teams</span>
        </div>
        <blockquote className="card">“People actually RSVP now, and we can see which departments show up.”</blockquote>
      </section>
      <section className="features-grid" id="request-demo">
        <h2>Request a demo</h2>
        {sent ? <p role="status">Thanks. We will reply to {form.email}.</p> : (
          <form className="card" onSubmit={(event) => {
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
      <section className="features-grid">
        <h2>FAQ</h2>
        <div className="faq">
          <details><summary>Does each company stay separate?</summary><p>Yes. People, events, and integrations belong to one tenant.</p></details>
          <details><summary>Can we try it without a real directory?</summary><p>Demo accounts are available in local development.</p></details>
          <details><summary>What is the setup console?</summary><p>It is the onboarding workspace for connecting a new company.</p></details>
        </div>
      </section>
      <footer className="landing-footer">
        <p>EventBuddy</p>
        <Link to="/login">Sign in</Link>
      </footer>
    </div>
  );
};

export default LandingPage;
