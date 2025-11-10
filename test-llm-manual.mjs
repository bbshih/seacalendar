/**
 * Manual LLM test - set your API key below
 * Run with: node test-llm-manual.mjs
 */

import { parseEventWithLLM } from './packages/shared/dist/utils/llmDateParser.js';

// ⚠️ PASTE YOUR API KEY HERE (don't commit this file!)
process.env.ANTHROPIC_API_KEY = 'PASTE_YOUR_KEY_HERE';

const testCase = "Q1 2025 Hangout - every Friday and Saturday";

console.log('🧪 Testing LLM Parser');
console.log(`📝 Input: "${testCase}"\n`);

try {
  const result = await parseEventWithLLM(testCase);

  if (result) {
    console.log('✅ LLM Result:');
    console.log('   Title:', result.title);
    console.log('   Confidence:', result.confidence);
    console.log('   Date Ranges:');
    result.dateRanges.forEach((range, i) => {
      console.log(`   ${i + 1}. ${range.start} to ${range.end}`);
      if (range.daysOfWeek) console.log(`      Days: ${range.daysOfWeek.join(', ')}`);
      if (range.times) console.log(`      Times: ${range.times.join(', ')}`);
    });
  } else {
    console.log('❌ LLM returned null (check API key)');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}
