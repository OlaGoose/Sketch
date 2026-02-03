/**
 * Test script to verify Doubao API connectivity
 * Run with: node scripts/test-doubao.js
 */

const fs = require('fs');
const path = require('path');

async function testDoubaoConnection() {
  console.log('🔍 Testing Doubao API connection...\n');

  // Load environment variables manually from .env.local
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file:', error.message);
  }

  const apiKey = process.env.NEXT_DOUBAO_API_KEY;
  const endpoint = process.env.NEXT_DOUBAO_CHAT_ENDPOINT;
  const model = process.env.NEXT_DOUBAO_CHAT_MODEL;
  
  if (!apiKey || !endpoint || !model) {
    console.error('❌ Error: Doubao configuration incomplete');
    console.error('Required environment variables:');
    console.error('  - NEXT_DOUBAO_API_KEY:', apiKey ? '✅' : '❌');
    console.error('  - NEXT_DOUBAO_CHAT_ENDPOINT:', endpoint ? '✅' : '❌');
    console.error('  - NEXT_DOUBAO_CHAT_MODEL:', model ? '✅' : '❌');
    process.exit(1);
  }

  console.log('✅ Configuration found:');
  console.log('  - API Key:', apiKey.substring(0, 10) + '...');
  console.log('  - Endpoint:', endpoint);
  console.log('  - Model:', model);
  console.log();

  try {
    console.log('📤 Sending test request...');
    const startTime = Date.now();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, Doubao API test successful!" in one sentence.',
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️  Response received in ${duration}ms\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FAILED: HTTP', response.status, response.statusText);
      console.error('Error response:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    console.log('📝 Response text:', text);
    console.log('\n🎉 SUCCESS: Doubao API is working correctly!');
    
    // Check usage
    if (data.usage) {
      console.log('\n📊 Token usage:');
      console.log('  - Prompt tokens:', data.usage.prompt_tokens);
      console.log('  - Completion tokens:', data.usage.completion_tokens);
      console.log('  - Total tokens:', data.usage.total_tokens);
    }

  } catch (error) {
    console.error('\n❌ FAILED: Doubao API test failed');
    console.error('\nError details:');
    console.error('  Message:', error.message);
    console.error('  Name:', error.name);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    console.error('\n💡 Common issues:');
    console.error('  1. Invalid API key or endpoint');
    console.error('  2. Network connectivity issues');
    console.error('  3. Model not available');
    
    process.exit(1);
  }
}

testDoubaoConnection();
