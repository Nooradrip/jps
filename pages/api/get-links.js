import { scrapeWordPressLinks } from '../../lib/scraper';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subject } = req.body;
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const links = await scrapeWordPressLinks(subject);
    if (links.length === 0) {
      return res.status(404).json({ error: 'No articles found' });
    }

    res.status(200).json({ links });
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
}