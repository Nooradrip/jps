import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [step, setStep] = useState('subject');
  const [subject, setSubject] = useState('');
  const [links, setLinks] = useState([]);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [customLink, setCustomLink] = useState('');
  const [wordCount, setWordCount] = useState(300);
  const [headline, setHeadline] = useState('');
  const [tone, setTone] = useState('neutral');
  const [article, setArticle] = useState('');
  const [error, setError] = useState('');

  // Step 1: Fetch links
  const fetchLinks = async () => {
    try {
      setError('');
      const res = await fetch('/api/get-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      });
      if (!res.ok) throw new Error('Failed to fetch links');
      const { links } = await res.json();
      setLinks(links);
      setStep('select-links');
    } catch (err) {
      setError(err.message);
    }
  };

  // Step 2: Generate article
  const generateArticle = async () => {
    try {
      setError('');
      const allLinks = customLink 
        ? [...selectedLinks.map(l => l.link), customLink] 
        : selectedLinks.map(l => l.link);
      
      if (allLinks.length === 0) throw new Error('Please select at least one link');
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          links: allLinks,
          wordCount,
          headline,
          tone,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate article');
      const { article } = await res.json();
      setArticle(article);
      setStep('result');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Head>
        <title>Journalist Press Services Article Generator</title>
        <meta name="description" content="Generate properly sourced news articles from Journalist Press Services" />
      </Head>

      {/* Buy Me a Coffee */}
      <div style={{ float: 'right', margin: '20px', textAlign: 'center' }}>
        <a 
          href="https://buymeacoffee.com/journalistpressservices" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'blue', textDecoration: 'underline' }}
        >
          Buy Me a Coffee
        </a>
        <p style={{ fontSize: '0.8em', marginTop: '5px' }}>
          If you liked the output, please use this link to pay $1 per 100 words + fees
        </p>
      </div>

      <h1>Journalist Press Services Article Generator</h1>

      {error && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', margin: '10px 0' }}>
          Error: {error}
        </div>
      )}

      {step === 'subject' && (
        <div style={{ marginTop: '20px' }}>
          <input 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            placeholder="Enter subject (e.g., climate change)"
            style={{ padding: '8px', width: '300px' }}
          />
          <button 
            onClick={fetchLinks}
            style={{ padding: '8px 15px', marginLeft: '10px' }}
          >
            Search Articles
          </button>
        </div>
      )}

      {step === 'select-links' && (
        <div style={{ marginTop: '20px' }}>
          <h2>Select Sources</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
            {links.map((linkData) => (
              <div key={linkData.link} style={{ marginBottom: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedLinks.some(l => l.link === linkData.link)}
                  onChange={() => 
                    setSelectedLinks(prev =>
                      prev.some(l => l.link === linkData.link)
                        ? prev.filter(l => l.link !== linkData.link)
                        : [...prev, linkData]
                    )
                  }
                />
                <span style={{ marginLeft: '10px' }}>
                  <a 
                    href={linkData.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'blue', textDecoration: 'underline' }}
                  >
                    {linkData.translatedHeadline}
                  </a>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    Original: {linkData.originalHeadline}
                  </div>
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3>Additional Options</h3>
            <div style={{ marginBottom: '15px' }}>
              <label>
                Paste another link (optional):
                <input
                  type="text"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Word count:
                <input
                  type="number"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  style={{ width: '100px', padding: '8px', marginLeft: '10px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Custom headline (optional):
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                Tone:
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value)}
                  style={{ padding: '8px', marginLeft: '10px' }}
                >
                  <option value="neutral">Neutral</option>
                  <option value="sensational">Sensational</option>
                  <option value="academic">Academic</option>
                </select>
              </label>
            </div>

            <button 
              onClick={generateArticle}
              style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none' }}
            >
              Generate Article
            </button>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div style={{ marginTop: '20px' }}>
          <h2>{headline || 'Generated Article'}</h2>
          <div 
            style={{ 
              border: '1px solid #ddd', 
              padding: '20px', 
              marginTop: '15px',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: article }}
          />
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => setStep('subject')}
              style={{ padding: '8px 15px' }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <a 
          href="https://journalistpressservices.wordpress.com" 
          style={{ color: 'blue', textDecoration: 'underline' }}
        >
          Return to Journalist Press Services
        </a>
      </div>
    </div>
  );
}