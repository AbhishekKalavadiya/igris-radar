'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ContactForm() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get('first-name'),
      lastName: formData.get('last-name'),
      email: formData.get('email'),
      message: formData.get('message')
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-center text-center py-16">
        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Message sent!</h2>
        <p className="text-muted-foreground">We've received your inquiry and will be in touch shortly.</p>
        <Button variant="outline" className="mt-6" onClick={() => setStatus('idle')}>Send another</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
      {status === 'error' && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
          Something went wrong. Please try again or email us directly.
        </div>
      )}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="first-name" className="text-sm font-medium">First name</label>
            <input
              id="first-name"
              name="first-name"
              type="text"
              required
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Jane"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="last-name" className="text-sm font-medium">Last name</label>
            <input
              id="last-name"
              name="last-name"
              type="text"
              required
              className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Doe"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Work email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="jane@company.com"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="message" className="text-sm font-medium">How can we help?</label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            placeholder="Tell us about your site, your team, and what you're trying to improve…"
          />
        </div>
        <Button 
          type="submit" 
          disabled={status === 'loading'}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
        >
          {status === 'loading' ? 'Sending...' : 'Send message'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">We typically respond within one business day.</p>
      </form>
    </div>
  );
}
