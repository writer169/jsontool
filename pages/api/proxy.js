// pages/api/proxy.js

export default async function handler(req, res) {
  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Проверяем, что URL безопасный
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    console.log('Fetching URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'JSON-Formatter/1.0 (Next.js API Route)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // Добавляем таймаут
      signal: AbortSignal.timeout(10000) // 10 секунд
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      });
    }

    // Получаем данные
    const data = await response.text();
    
    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Определяем тип контента
    const contentType = response.headers.get('content-type') || 'text/plain';
    res.setHeader('Content-Type', contentType);
    
    // Возвращаем данные
    res.status(200).send(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    let errorMessage = 'Failed to fetch data';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout (10 seconds)';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Domain not found';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    } else {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
}