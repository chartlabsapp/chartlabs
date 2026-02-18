// ============================================
// ChartLabs — Public Landing Page
// ============================================

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    BarChart3, Clock, Image, Shield, Zap, FolderOpen
} from 'lucide-react';
import FAQSection from '../components/features/FAQSection';
import './LandingPage.css';

export default function LandingPage() {
    const { signIn, signUp, signInWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const result = mode === 'signin'
            ? await signIn(email, password)
            : await signUp(email, password);
        if (result.error) {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        setError(null);
        const result = await signInWithGoogle();
        if (result.error) setError(result.error);
    };

    const scrollToAuth = () => {
        document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToFAQ = () => {
        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="landing-page">
            {/* Nav */}
            <nav className="landing-nav">
                <div className="landing-logo">
                    <div className="landing-logo-icon">CL</div>
                    ChartLabs
                </div>
                <div className="landing-nav-links">
                    <button className="landing-nav-link" onClick={scrollToFAQ}>FAQ</button>
                    <a href="https://github.com/google-labs-code" target="_blank" rel="noreferrer" className="landing-nav-link">Github</a>
                </div>
                <div className="landing-nav-cta">
                    <button className="landing-btn landing-btn-secondary" onClick={scrollToAuth}>
                        Sign In
                    </button>
                    <button className="landing-btn landing-btn-primary" onClick={() => { setMode('signup'); scrollToAuth(); }}>
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <div className="hero-badge">
                    <span className="hero-badge-dot" />
                    Free & Open Source
                </div>
                <h1>
                    <span className="hero-gradient-text">
                        Master Your Backtesting
                    </span>
                    <br />
                    with Precision
                </h1>
                <p>
                    ChartLabs is a visual backtesting journal for traders. Capture charts,
                    track performance, and discover patterns in your trading strategy.
                </p>
                <div className="hero-actions">
                    <button className="landing-btn landing-btn-primary" onClick={() => { setMode('signup'); scrollToAuth(); }}>
                        Create Free Account
                    </button>
                    <button className="landing-btn landing-btn-secondary" onClick={scrollToAuth}>
                        Sign In
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="landing-features">
                <h2>Everything you need to improve</h2>
                <p>Powerful tools designed for serious traders who want to level up their edge.</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><Image size={22} /></div>
                        <h3>Visual Chart Journal</h3>
                        <p>Upload chart screenshots, tag with symbols, timeframes, sessions, and setups. Build a searchable archive of every trade.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><BarChart3 size={22} /></div>
                        <h3>Analytics Dashboard</h3>
                        <p>Win rate, R:R distribution, profit factor, equity curves — see your performance from every angle.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Clock size={22} /></div>
                        <h3>Session Timer</h3>
                        <p>Track time spent studying charts per project, symbol, and theme. Understand where your hours go.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><FolderOpen size={22} /></div>
                        <h3>Organized Storage</h3>
                        <p>Charts are saved locally in a clean project/theme folder structure. Your data stays on your machine.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Shield size={22} /></div>
                        <h3>Privacy First</h3>
                        <p>All chart data is stored locally using the File System Access API. No cloud uploads. No data mining.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Zap size={22} /></div>
                        <h3>Lightning Fast</h3>
                        <p>Built with modern web tech for instant load times. No heavy desktop app required.</p>
                    </div>
                </div>
            </section>

            {/* Auth Section */}
            <section className="landing-auth-section" id="auth-section">
                <div className="landing-auth-card">
                    <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
                    <p>{mode === 'signin' ? 'Sign in to access your workspace' : 'Start your backtesting journey'}</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="auth-error">{error}</div>}

                        <input
                            className="auth-input"
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />

                        <button className="auth-submit" type="submit" disabled={loading}>
                            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                        </button>

                        <div className="auth-divider">or</div>

                        <button type="button" className="auth-google" onClick={handleGoogle}>
                            Continue with Google
                        </button>
                    </form>

                    <div className="auth-toggle">
                        {mode === 'signin' ? (
                            <>Don't have an account? <button onClick={() => setMode('signup')}>Sign up</button></>
                        ) : (
                            <>Already have an account? <button onClick={() => setMode('signin')}>Sign in</button></>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq-section" className="landing-faq-wrapper">
                <FAQSection />
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                © {new Date().getFullYear()} ChartLabs — Built for traders, by traders.
            </footer>
        </div>
    );
}
