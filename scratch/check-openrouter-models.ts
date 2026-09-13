import https from 'https';

https.get('https://openrouter.ai/api/v1/models', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const sonnetModels = data.data.filter((m: any) => 
        m.id.includes('sonnet') || m.name.toLowerCase().includes('sonnet') || m.id.includes('claude')
      );
      console.log('Found Sonnet / Claude models:');
      sonnetModels.forEach((m: any) => {
        const promptPrice = (parseFloat(m.pricing.prompt) * 1000000).toFixed(2);
        const completionPrice = (parseFloat(m.pricing.completion) * 1000000).toFixed(2);
        console.log(`- ID: ${m.id} | Name: ${m.name} | Input: $${promptPrice}/M | Output: $${completionPrice}/M`);
      });
    } catch(e) {
      console.error(e);
    }
  });
});
