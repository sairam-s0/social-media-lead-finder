/**
 * Standalone Client-Side Lead Discovery Engine for Android Mobile & Offline.
 * Enables full search, intent evaluation, parsing, and Telegram notification dispatch
 * directly from the Android device over HTTPS without requiring a desktop server.
 */
import axios from 'axios';
import { normalizePostUrl } from '../utils/urlHelper';

// Intent keywords matching backend logic
const POSITIVE_INTENT_KEYWORDS = [
  'looking for', 'need', 'seeking', 'require', 'required', 'want',
  'hiring', 'budget', 'urgent', 'recommend', 'proposal', 'freelancer',
  'agency', 'developer', 'consultant', 'partner', 'contractor'
];

const REJECT_KEYWORDS = [
  'looking for a job', 'looking for work', 'seeking employment',
  'job seeker', 'my resume', 'my cv', 'hire me', 'open to work',
  'open for work', 'seeking a role'
];

export const evaluateIntent = (text = '') => {
  const lower = text.toLowerCase();
  for (const neg of REJECT_KEYWORDS) {
    if (lower.includes(neg)) {
      return { isLead: false, reason: 'Job seeker / candidate post' };
    }
  }

  let matches = 0;
  for (const pos of POSITIVE_INTENT_KEYWORDS) {
    if (lower.includes(pos)) matches++;
  }

  return {
    isLead: matches > 0 || text.length > 20,
    score: Math.min(100, matches * 25 + 30),
    matchedKeywords: POSITIVE_INTENT_KEYWORDS.filter(k => lower.includes(k))
  };
};

export const extractPlatformFromUrl = (url = '') => {
  const l = url.toLowerCase();
  if (l.includes('linkedin.com')) return 'LinkedIn';
  if (l.includes('twitter.com') || l.includes('x.com')) return 'Twitter / X';
  if (l.includes('reddit.com')) return 'Reddit';
  if (l.includes('facebook.com')) return 'Facebook';
  if (l.includes('upwork.com')) return 'Upwork';
  return 'Web Search';
};

export const extractCompanyName = (title = '', url = '', author = '') => {
  // Try extracting from title "at Company" or "Company is looking"
  const atMatch = title.match(/(?:at|with|by|for)\s+([A-Z][A-Za-z0-9&.\- ]{2,25})/);
  if (atMatch && atMatch[1]) return atMatch[1].trim();

  // Try extracting domain name
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const cleanDomain = domain.split('.')[0];
    if (cleanDomain && !['linkedin', 'x', 'twitter', 'reddit', 'google'].includes(cleanDomain)) {
      return cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
    }
  } catch (e) {}

  return author && author !== 'Anonymous' ? `${author}'s Project` : 'Confidential Client';
};

export const runDirectExaSearch = async (query, apiKey, numResults = 8) => {
  if (!apiKey || apiKey.startsWith('••••') || apiKey.startsWith('****')) {
    throw new Error('Valid Exa API key is required for direct web search.');
  }

  const response = await axios.post(
    'https://api.exa.ai/search',
    {
      query: `${query} ("looking for" OR "need" OR "hiring agency")`,
      numResults: numResults,
      type: 'neural',
      useAutoprompt: true
    },
    {
      headers: {
        'x-api-key': apiKey.trim(),
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  const results = response.data?.results || [];
  const leads = [];

  for (const item of results) {
    const text = `${item.title || ''} ${item.text || ''}`;
    const intent = evaluateIntent(text);

    if (intent.isLead) {
      const company = extractCompanyName(item.title, item.url, item.author);
      leads.push({
        id: Date.now() + Math.floor(Math.random() * 10000),
        source: extractPlatformFromUrl(item.url),
        company_name: company,
        url: normalizePostUrl(item.url),
        title: item.title || 'Inquiry: ' + query,
        service: query,
        content: item.text || item.title || 'High-intent post discovered on ' + extractPlatformFromUrl(item.url),
        author_name: item.author || 'Direct Inquirer',
        author_role: 'Decision Maker',
        matched_keywords: intent.matchedKeywords.join(', ') || 'seeking assistance',
        status: 'new',
        created_at: new Date().toISOString()
      });
    }
  }

  return leads;
};

export const sendDirectTelegramAlert = async (botToken, chatId, lead) => {
  if (!botToken || !chatId) return false;
  try {
    const message = `🎯 <b>New Lead Discovered (Android App)</b>\n\n` +
      `🏢 <b>Company:</b> ${lead.company_name}\n` +
      `📌 <b>Title:</b> ${lead.title}\n` +
      `🌐 <b>Platform:</b> ${lead.source}\n` +
      `💼 <b>Service:</b> ${lead.service}\n` +
      `🔗 <b>Link:</b> ${lead.url}`;

    await axios.post(
      `https://api.telegram.org/bot${botToken.trim()}/sendMessage`,
      {
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      },
      { timeout: 8000 }
    );
    return true;
  } catch (err) {
    console.warn('Direct Telegram dispatch failed:', err);
    return false;
  }
};
