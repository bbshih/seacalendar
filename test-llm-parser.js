/**
 * Test script for LLM date parser
 * Run with: ANTHROPIC_API_KEY=sk-ant-... node test-llm-parser.js
 * Or: source .env.development && node test-llm-parser.js
 */

// Import the parser
const { parseEventDescriptionSmart } = require('./packages/shared/dist/utils/nlpDateParser.js');

const testCases = [
  "Q1 2025 Hangout - Fridays and Saturdays",
  "Movie night every weekend for the next 3 months",
  "Dinner on Jan 10, 17, 24 at 7:30pm",
  "Boys Night every Friday and Saturday in January",
  "Hangout this Friday through next Wednesday",
  "Birthday party tomorrow at 6pm",
  "Weekly standup every Monday in Q1 2025",
];

async function runTests() {
  console.log('🧪 Testing LLM Date Parser\n');
  console.log('API Key configured:', !!process.env.ANTHROPIC_API_KEY);
  console.log('─'.repeat(80));

  for (const testCase of testCases) {
    console.log(`\n📝 Input: "${testCase}"`);

    try {
      const result = await parseEventDescriptionSmart(testCase);

      console.log(`   ✅ Title: ${result.title}`);
      console.log(`   📅 Dates: ${result.dates.length} dates`);
      if (result.dates.length > 0) {
        console.log(`      First: ${result.dates[0].toISOString().split('T')[0]}`);
        console.log(`      Last: ${result.dates[result.dates.length - 1].toISOString().split('T')[0]}`);
      }
      if (result.times.length > 0) {
        console.log(`   🕐 Times: ${result.times.join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log('✅ Tests complete!');
}

runTests().catch(console.error);
