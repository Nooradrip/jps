import { scrapeArticleText } from '../../lib/scraper';
import { OpenAI } from 'openai';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { links, wordCount, headline, tone } = req.body;
    
    // Validate inputs
    if (!links || links.length === 0) {
      return res.status(400).json({ error: 'Please select at least one link' });
    }
    if (wordCount < 100 || wordCount > 2000) {
      return res.status(400).json({ error: 'Word count must be between 100-2000' });
    }

    // Scrape all links
    let combinedText = '';
    const allQuotes = [];
    
    for (const link of links) {
      const { text, quotes } = await scrapeArticleText(link);
      combinedText += text + '\n\n';
      allQuotes.push(...quotes);
      
      // Avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (allQuotes.length < 3) {
      return res.status(400).json({ 
        error: `Only found ${allQuotes.length} quotes. Need at least 3 from selected articles.` 
      });
    }

    // Generate article
    const prompt = `
      Write a ${wordCount}-word news article in English USING ONLY the information below.
      ---
      SOURCES:
      ${combinedText.slice(0, 5000)}
      ---
      QUOTES (use at least 3):
      ${allQuotes.map(q => 
        `- "*${q.text}*," ${q.speaker} told <a href="${q.url}" target="_blank">${q.source}</a>`
      ).join('\n')}
      ---
      STRUCTURE:
      1. FIRST PARAGRAPH: Who, what, where, when (lead with key fact)
      2. SECOND PARAGRAPH: Why this matters (context/impact)
      3. PARAGRAPHS 3-4: Key details with quotes
      4. FIFTH PARAGRAPH: Conclusion (future actions/predictions)
      ---
      RULES:
      - Always attribute quotes EXACTLY as shown above
      - Include speaker titles/organizations when available
      - Never add unverified information
      - Tone: ${tone}
      ${headline ? `Headline: ${headline}` : 'Suggest a concise headline'}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    res.status(200).json({ article: response.choices[0].message.content });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate article' });
  }
}