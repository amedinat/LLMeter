'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

interface FeedbackWidgetProps {
  projectSlug: string;
  apiKey: string;
  ingestUrl: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark';
  accentColor?: string;
  userRef?: string;
  source?: string;
}

type Sentiment = 'positive' | 'negative' | 'feature_request';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ── Styles (CSS-in-JS) ─────────────────────────────────────────────────────

const Z = 2147483000;

function getStyles(theme: 'light' | 'dark', accent: string, position: 'bottom-right' | 'bottom-left') {
  const isDark = theme === 'dark';
  const bg = isDark ? 'rgba(20, 20, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const text = isDark ? '#e4e4e7' : '#18181b';
  const textMuted = isDark ? '#a1a1aa' : '#71717a';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const positionSide = position === 'bottom-right' ? 'right' : 'left';

  return {
    trigger: {
      position: 'fixed' as const,
      bottom: '24px',
      [positionSide]: '24px',
      zIndex: Z,
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: 'none',
      background: accent,
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 20px ${accent}66`,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    } as React.CSSProperties,
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: Z + 1,
      background: 'rgba(0,0,0,0.3)',
    } as React.CSSProperties,
    modal: {
      position: 'fixed' as const,
      bottom: '84px',
      [positionSide]: '24px',
      zIndex: Z + 2,
      width: '380px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto' as const,
      borderRadius: '16px',
      background: bg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${border}`,
      boxShadow: isDark
        ? '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
        : '0 24px 48px rgba(0,0,0,0.15)',
      padding: '24px',
      color: text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
    } as React.CSSProperties,
    title: { margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: text } as React.CSSProperties,
    subtitle: { margin: '0 0 20px', fontSize: '13px', color: textMuted } as React.CSSProperties,
    label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: textMuted } as React.CSSProperties,
    textarea: {
      width: '100%', minHeight: '100px', padding: '10px 12px', borderRadius: '10px',
      border: `1px solid ${border}`, background: inputBg, color: text, fontSize: '14px',
      fontFamily: 'inherit', resize: 'vertical' as const, outline: 'none',
      boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
    } as React.CSSProperties,
    input: {
      width: '100%', padding: '10px 12px', borderRadius: '10px',
      border: `1px solid ${border}`, background: inputBg, color: text, fontSize: '14px',
      fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
      transition: 'border-color 0.15s',
    } as React.CSSProperties,
    sentimentRow: { display: 'flex', gap: '8px', marginBottom: '16px' } as React.CSSProperties,
    sentimentBtn: (active: boolean) => ({
      flex: 1, padding: '8px 4px', borderRadius: '10px',
      border: `1px solid ${active ? accent : border}`,
      background: active ? `${accent}20` : 'transparent',
      color: active ? accent : textMuted, cursor: 'pointer', fontSize: '13px',
      fontWeight: active ? 600 : 400, display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', gap: '4px', transition: 'all 0.15s',
    }) as React.CSSProperties,
    submitBtn: {
      width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
      background: accent, color: '#fff', fontSize: '14px', fontWeight: 600,
      cursor: 'pointer', transition: 'opacity 0.15s',
    } as React.CSSProperties,
    fieldGroup: { marginBottom: '16px' } as React.CSSProperties,
    successMsg: { textAlign: 'center' as const, padding: '32px 0' } as React.CSSProperties,
    errorMsg: { color: '#ef4444', fontSize: '13px', marginBottom: '12px' } as React.CSSProperties,
  };
}

// ── Icons ───────────────────────────────────────────────────────────────────

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function FeedbackWidget({
  projectSlug,
  apiKey,
  ingestUrl,
  position = 'bottom-right',
  theme = 'dark',
  accentColor = '#6366f1',
  userRef,
  source = 'widget',
}: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [email, setEmail] = useState(userRef ?? '');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const s = getStyles(theme, accentColor, position);

  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, textarea, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); return; }
      if (e.key !== 'Tab' || !modal) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const resetForm = useCallback(() => {
    setContent(''); setSentiment(null); setEmail(userRef ?? '');
    setSubmitState('idle'); setErrorMsg('');
  }, [userRef]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitState('submitting');
    setErrorMsg('');
    try {
      const url = ingestUrl.replace(/\/$/, '');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          type: 'feedback', project_slug: projectSlug,
          data: { source, content: content.trim(), sentiment: sentiment ?? 'neutral', user_ref: email.trim() || undefined },
        }),
      });
      if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(body || `HTTP ${res.status}`); }
      setSubmitState('success');
      setTimeout(() => { setOpen(false); resetForm(); }, 2000);
    } catch (err) {
      setSubmitState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleToggle = () => { if (open) { setOpen(false); resetForm(); } else { setOpen(true); } };

  useEffect(() => {
    const id = 'sp-feedback-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes sp-fb-fadein { from { opacity:0; transform:translateY(8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
    `;
    document.head.appendChild(style);
  }, []);

  const sentiments: { key: Sentiment; icon: string; label: string }[] = [
    { key: 'positive', icon: '👍', label: 'Good' },
    { key: 'negative', icon: '👎', label: 'Bad' },
    { key: 'feature_request', icon: '💡', label: 'Idea' },
  ];

  return (
    <>
      <button ref={triggerRef} onClick={handleToggle} style={s.trigger}
        aria-label={open ? 'Close feedback' : 'Send feedback'} aria-expanded={open} aria-haspopup="dialog">
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
      {open && <div style={s.overlay} onClick={() => { setOpen(false); resetForm(); }} aria-hidden="true" />}
      {open && (
        <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Send feedback"
          style={{ ...s.modal, animation: 'sp-fb-fadein 0.2s ease forwards' }}>
          {submitState === 'success' ? (
            <div style={s.successMsg}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
              <p style={{ ...s.title, marginBottom: '4px' }}>Thank you!</p>
              <p style={s.subtitle}>Your feedback has been sent.</p>
            </div>
          ) : (
            <>
              <h2 style={s.title}>Send feedback</h2>
              <p style={s.subtitle}>We&#39;d love to hear what you think.</p>
              <div style={s.fieldGroup}>
                <label style={s.label}>How do you feel?</label>
                <div style={s.sentimentRow} role="radiogroup" aria-label="Sentiment">
                  {sentiments.map((item) => (
                    <button key={item.key} type="button" role="radio" aria-checked={sentiment === item.key}
                      aria-label={item.label} style={s.sentimentBtn(sentiment === item.key)}
                      onClick={() => setSentiment(sentiment === item.key ? null : item.key)}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={s.fieldGroup}>
                <label htmlFor="sp-fb-content" style={s.label}>Your feedback *</label>
                <textarea id="sp-fb-content" value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell us what's on your mind..." style={s.textarea} required />
              </div>
              <div style={s.fieldGroup}>
                <label htmlFor="sp-fb-email" style={s.label}>Email (optional)</label>
                <input id="sp-fb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" style={s.input} />
              </div>
              {submitState === 'error' && <p style={s.errorMsg}>{errorMsg || 'Failed to send. Please try again.'}</p>}
              <button type="button" onClick={handleSubmit} disabled={!content.trim() || submitState === 'submitting'}
                style={{ ...s.submitBtn, opacity: !content.trim() || submitState === 'submitting' ? 0.5 : 1,
                  cursor: !content.trim() || submitState === 'submitting' ? 'not-allowed' : 'pointer' }}
                aria-label="Submit feedback">
                {submitState === 'submitting' ? 'Sending...' : 'Send feedback'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

export function SaasPulseFeedback({ userRef }: { userRef?: string }) {
  const apiKey = process.env.NEXT_PUBLIC_SAAS_PULSE_API_KEY;
  const ingestUrl = process.env.NEXT_PUBLIC_SAAS_PULSE_INGEST_URL;

  if (!apiKey || !ingestUrl) return null;

  return (
    <FeedbackWidget
      projectSlug="llmeter"
      apiKey={apiKey}
      ingestUrl={ingestUrl}
      theme="dark"
      accentColor="#6366f1"
      userRef={userRef}
      source="llmeter-dashboard"
    />
  );
}
