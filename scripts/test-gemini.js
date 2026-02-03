/**
 * Test script to verify Gemini API connectivity
 * Run with: node scripts/test-gemini.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiConnection() {
  console.log('🔍 Testing Gemini API connection...\n');

  // Load environment variables manually from .env.local
  try {
    const fs = require('fs');
    const path = require('path');
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

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: No API key found in environment variables');
    console.error('Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...\n');

  try {
    console.log('📡 Initializing Gemini client...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });

    console.log('📤 Sending test request...');
    const startTime = Date.now();
    
    const result = await model.generateContent('Say "Hello, API test successful!" in one sentence.');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms\n`);

    const text = result.response.text();
    console.log('📝 Response text:', text);
    console.log('\n🎉 SUCCESS: Gemini API is working correctly!');
    
    // Check usage metadata if available
    if (result.response.usageMetadata) {
      console.log('\n📊 Token usage:');
      console.log('  - Prompt tokens:', result.response.usageMetadata.promptTokenCount);
      console.log('  - Completion tokens:', result.response.usageMetadata.candidatesTokenCount);
      console.log('  - Total tokens:', result.response.usageMetadata.totalTokenCount);
    }

  } catch (error) {
    console.error('\n❌ FAILED: Gemini API test failed');
    console.error('\nError details:');
    console.error('  Message:', error.message);
    console.error('  Name:', error.name);
    
    if (error.status) {
      console.error('  Status:', error.status);
    }
    
    if (error.cause) {
      console.error('  Cause:', error.cause);
    }
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    console.error('\n💡 Common issues:');
    console.error('  1. Invalid API key');
    console.error('  2. API key quota exceeded');
    console.error('  3. Network connectivity issues (firewall, proxy, DNS)');
    console.error('  4. API key not enabled for Gemini API');
    console.error('  5. Region restrictions');
    
    process.exit(1);
  }
}

testGeminiConnection();
