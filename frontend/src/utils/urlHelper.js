/**
 * URL normalization & safe browser launching utility
 * Ensures post URLs open reliably on both desktop web browsers and mobile devices.
 */

export const normalizePostUrl = (url = '') => {
  if (!url || typeof url !== 'string') return '';
  
  let clean = url.trim().replace(/^["']|["']$/g, '');
  if (!clean) return '';

  // Ensure protocol
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  // LinkedIn Normalization
  if (clean.toLowerCase().includes('linkedin.com')) {
    // Check for activity ID pattern: activity-7493936706136653824 or urn:li:activity:7493936706136653824
    const actMatch = clean.match(/activity[-:](?:urn:li:activity:)?(\d+)/i);
    if (actMatch && actMatch[1]) {
      return `https://www.linkedin.com/feed/update/urn:li:activity:${actMatch[1]}/`;
    }

    const urnMatch = clean.match(/urn:li:(?:activity|share):(\d+)/i);
    if (urnMatch && urnMatch[1]) {
      return `https://www.linkedin.com/feed/update/urn:li:activity:${urnMatch[1]}/`;
    }
  }

  // Strip tracking parameters (?utm_source=... etc.)
  try {
    const parsed = new URL(clean);
    // Remove typical tracking search params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'rcm', 'refId', 'trackingId'];
    trackingParams.forEach(p => parsed.searchParams.delete(p));
    // If no params left, return clean pathname
    const finalUrl = parsed.toString().replace(/\/+$/, '');
    return finalUrl;
  } catch (e) {
    return clean.split('?')[0].replace(/\/+$/, '');
  }
};

export const normalizeCompanyUrl = (url = '') => {
  if (!url || typeof url !== 'string' || url === 'Not available') return '';
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
};

export const openExternalUrl = async (url, e) => {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  if (!url) return;
  const isLinkedIn = typeof url === 'string' && url.toLowerCase().includes('linkedin.com');
  const targetUrl = isLinkedIn ? normalizePostUrl(url) : (normalizeCompanyUrl(url) || normalizePostUrl(url));
  if (!targetUrl) return;

  // 1. In native mobile (Capacitor Android app shell)
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    try {
      window.open(targetUrl, '_system');
      return;
    } catch (err) {
      console.warn('Capacitor window.open failed:', err);
    }
  }

  // 2. Try desktop backend to open in default system browser (Google Chrome, Edge, etc.)
  // This keeps PyWebView / desktop app completely intact and opens the link in the user's real browser!
  try {
    const apiBase = typeof window !== 'undefined' && window.localStorage?.getItem('api_server_url')
      ? `${window.localStorage.getItem('api_server_url').replace(/\/$/, '')}/api`
      : '/api';

    const resp = await fetch(`${apiBase}/system/open-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl }),
    });

    if (resp.ok) {
      return;
    }
  } catch (err) {
    // Backend open-url unreachable (e.g. offline mobile without local server)
  }

  // 3. Web browser fallback: opens safely in a new tab without redirecting the app
  try {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.warn('Browser window open blocked:', err);
  }
};
