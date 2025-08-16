import { OpenAI } from 'openai';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function scrapeWordPressLinks(subject) {
  try {
    const searchUrl = `https://journalistpressservices.wordpress.com/?s=${encodeURIComponent(subject)}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const articles = Array.from(doc.querySelectorAll('article')).map(async (article) => {
      const link = article.querySelector('a')?.href;
      const originalHeadline = article.querySelector('h2')?.textContent.trim();
      
      if (!link || !originalHeadline) return null;
      
      // Translate non-English headlines
      const translatedHeadline = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Translate this to English (be concise, preserve proper names):\n\n${originalHeadline}`,
        }],
      }).then(res => res.choices[0].message.content);

      return { 
        link, 
        originalHeadline, 
        translatedHeadline,
      };
    });

    return (await Promise.all(articles)).filter(Boolean).slice(0, 5);
  } catch (error) {
    console.error('Scraping error:', error);
    return [];
  }
}

export async function scrapeArticleText(link) {
  try {
    const response = await fetch(link, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch ${link}`);
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract publication name
    const sourceName = doc.querySelector('meta[property="og:site_name"]')?.content 
                     || 'Journalist Press Services';

    // Extract quotes with speaker context
    const quotes = Array.from(doc.querySelectorAll('p, blockquote')).map(el => {
      const text = el.textContent.trim();
      
      // Match patterns like: "Quote," Speaker Name told Source
      const match = text.match(/(?:"(.*?)"|“(.*?)”),?\s*(?:—|said|told|according to)\s*([^,.<]+)(?:,\s*(?:[A-Z][^,.]+))?/i);
      
      if (match) {
        return {
          text: match[1] || match[2],
          speaker: match[3].trim(),
          source: sourceName,
          url: link
        };
      }
      return null;
    }).filter(Boolean);

    // Extract main article text
    const paragraphs = Array.from(doc.querySelectorAll('article p, .entry-content p'))
      .map(p => p.textContent.trim())
      .filter(p => p.length > 50); // Filter out short paragraphs

    return {
      text: paragraphs.join('\n\n'),
      quotes
    };
  } catch (error) {
    console.error(`Failed to scrape ${link}:`, error);
    return { text: '', quotes: [] };
  }
}