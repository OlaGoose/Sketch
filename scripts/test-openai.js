/**
 * Test script to verify OpenAI API connectivity
 * Run with: node scripts/test-openai.js
 */

const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');

async function testOpenAIConnection() {
  console.log('🔍 Testing OpenAI API connection...\n');

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

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: No API key found in environment variables');
    console.error('Please set NEXT_PUBLIC_OPENAI_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 15) + '...\n');

  try {
    console.log('📡 Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 30000,
      maxRetries: 2,
    });

    console.log('📤 Sending test request...');
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, OpenAI API test successful!" in one sentence.',
        },
      ],
      max_tokens: 50,
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms\n`);

    const text = response.choices[0]?.message?.content;
    console.log('📝 Response text:', text);
    console.log('\n🎉 SUCCESS: OpenAI API is working correctly!');
    
    // Check usage
    if (response.usage) {
      console.log('\n📊 Token usage:');
      console.log('  - Prompt tokens:', response.usage.prompt_tokens);
      console.log('  - Completion tokens:', response.usage.completion_tokens);
      console.log('  - Total tokens:', response.usage.total_tokens);
    }

  } catch (error) {
    console.error('\n❌ FAILED: OpenAI API test failed');
    console.error('\nError details:');
    console.error('  Message:', error.message);
    console.error('  Name:', error.name);
    
    if (error.status) {
      console.error('  Status:', error.status);
    }
    
    if (error.code) {
      console.error('  Code:', error.code);
    }
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    console.error('\n💡 Common issues:');
    console.error('  1. Invalid API key');
    console.error('  2. API key quota exceeded');
    console.error('  3. Network connectivity issues');
    console.error('  4. Billing not set up');
    
    process.exit(1);
  }
}

testOpenAIConnection();
