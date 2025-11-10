# LLM Date Parser Security

Security measures for the Claude API date parser to prevent abuse and cost overruns.

## Protections Implemented

### 1. Rate Limiting
**Location:** `packages/api/src/middleware/rateLimit.ts`

- **20 requests per hour per IP** for LLM parsing endpoints
- Prevents API cost abuse from spam attacks
- Returns 429 status with helpful message

### 2. Input Validation
**Location:** `packages/api/src/middleware/inputValidation.ts`

Validates that input:
- Contains date-related keywords (days, months, times, etc.)
- Does not contain prompt injection patterns:
  - "ignore previous instructions"
  - "you are now..."
  - "tell me your system prompt"
  - Script tags, command injection
- Is reasonable length (max 200 chars)
- Sanitized: trimmed, normalized whitespace

### 3. LLM-Level Protection
**Location:** `packages/shared/src/utils/llmDateParser.ts`

- **System prompt constraints:** Instructs Claude to ONLY parse dates
- **Input sanitization:** Removes control characters, normalizes text
- **Structured output:** JSON schema prevents freeform responses
- **Low confidence rejection:** Returns confidence score to filter bad parses

### 4. Cost Controls

**Current limits:**
- Max 20 API calls per hour per IP
- Max 200 chars input length = ~50 tokens
- Prompt caching reduces repeat costs to ~$0.0003/call
- **Estimated max cost:** ~$0.50/hour worst-case spam

## Testing

### Test legitimate inputs:
```bash
node test-llm-parser.js
```

### Test malicious inputs:
```bash
# Edit test-security.mjs to add your API key
node test-security.mjs
```

Expected behavior for attacks:
- Prompt injections: Rejected by middleware (400 error) or low confidence
- Spam: Rate limited after 20 requests/hour (429 error)
- Irrelevant content: Low confidence score, rejected by caller

## Monitoring

**What to watch:**
1. **Cost dashboards:** https://console.anthropic.com
2. **Rate limit hits:** Check API logs for 429 responses
3. **Suspicious patterns:** `[SECURITY]` warnings in logs

**Alert thresholds:**
- >$5/day API costs = investigate
- >50 rate limit violations/day = possible attack
- Repeated `[SECURITY]` warnings from same IP = ban

## Recommendations

### For production:

1. **Add authentication** for parse endpoints if possible
   ```typescript
   router.post("/parse-event", authMiddleware, llmParsingLimiter, ...)
   ```

2. **IP-based blocking** after repeated abuse
   ```typescript
   // Store blocked IPs in Redis/database
   if (isBlockedIP(req.ip)) return res.status(403)
   ```

3. **Set API budget cap** at Anthropic console (e.g., $50/month)

4. **Add monitoring alerts:**
   - Datadog/Sentry for cost spikes
   - CloudWatch for rate limit violations

5. **Consider Discord bot only** for LLM parsing (authenticated users)
   - Web users get local parser only
   - Discord users (authenticated) get LLM access

## Attack Scenarios & Mitigations

| Attack | Mitigation | Effectiveness |
|--------|-----------|---------------|
| Prompt injection | System prompt + input validation | High |
| Cost abuse via spam | Rate limiting (20/hour) | High |
| Distributed spam (botnets) | IP-based rate limit | Medium |
| Irrelevant queries | Date keyword validation | High |
| Data exfiltration | Structured output only | High |

## Emergency Response

**If API costs spike unexpectedly:**

1. **Immediate:** Remove `ANTHROPIC_API_KEY` from production env
   ```bash
   # On server
   unset ANTHROPIC_API_KEY
   systemctl restart seacalendar-api
   ```

2. **Temporary:** Disable LLM endpoints in code
   ```typescript
   router.post("/parse-event", (req, res) => {
     res.status(503).json({ message: "Temporarily disabled" })
   })
   ```

3. **Investigate:** Check logs for abuse patterns
   ```bash
   grep "\[SECURITY\]" /var/log/seacalendar/api.log
   ```

4. **Long-term:** Implement stricter auth/rate limits

## Cost Monitoring

**Normal usage:** $1-5/month
**With moderate abuse:** $10-20/month (rate limits cap it)
**Worst case (rate limits work):** ~$15-30/month

Set budget alert at **$25/month** in Anthropic console.
