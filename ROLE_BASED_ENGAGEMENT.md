# Role-Based Engagement Tracking

## Problem

In hybrid friend groups (local + remote members), traditional engagement tracking penalizes remote members:
- **Old system**: "Sarah hasn't attended an event in 60 days" → Flagged as drifting
- **Reality**: Sarah votes on every poll, shares memories, but lives 500 miles away

## Solution

Track **participation types** separately and filter by **Discord roles**.

---

## Features

### 1. Event Location Types

Events can now be marked as:
- **IN_PERSON** - Physical location only
- **VIRTUAL** - Online only (Zoom, Discord voice, etc.)
- **HYBRID** - Both options available

```typescript
// When creating event
poll.locationType = 'VIRTUAL'  // Remote-friendly
```

### 2. Participation Metrics

Users are tracked across multiple dimensions:
- `lastVotedAt` - Last vote timestamp
- `lastAttendedAt` - Last in-person event
- `lastMemorySharedAt` - Last memory/photo shared
- `lastInteractionAt` - Most recent of ANY activity
- `totalVirtualEvents` - Virtual event participation
- `totalMemoriesShared` - Memories contributed

**Drift risk** now uses `lastInteractionAt`, not just attendance.

### 3. Role-Based Filtering

Discord roles are tracked in database:
- **Local** - Lives nearby, can attend in-person
- **Remote** - Lives far away, virtual only
- **Alumni** - Moved away but still connected
- **Core** - Most active organizers
- _Any custom role you create_

---

## Usage

### Setup: Create Discord Roles

1. In Discord: Server Settings → Roles
2. Create roles: `@Local`, `@Remote`, `@Alumni`, etc.
3. Assign to members
4. Bot will auto-sync roles (implementation TODO)

### Command Examples

**View all engagement:**
```
/engagement stats
```

**Filter by Local members only:**
```
/engagement drifting role:@Local
```
Shows which local members haven't attended/voted recently.

**Filter by Remote members:**
```
/engagement stats role:@Remote
```
Shows engagement for remote folks (focuses on votes, not attendance).

**Leaderboard for specific role:**
```
/engagement leaderboard role:@Core
```
See most engaged members in the @Core role.

---

## Recommendations by Role Type

### For @Local Members
**Track:**
- In-person event attendance
- Vote participation
- Memory sharing

**Red flags:**
- Haven't attended in 60+ days
- Stopped voting (may have lost interest)

**Actions:**
- DM: "Hey, we miss you! Game night next Friday?"
- Check if they moved away (update to @Remote)

### For @Remote Members
**Track:**
- Vote participation
- Memory/photo sharing
- Virtual event attendance

**Red flags:**
- Stopped voting (60+ days)
- No memories shared in 90+ days

**Actions:**
- Create virtual events: "Virtual hangout this Saturday?"
- Ask: "How can we include you better from afar?"

### For @Alumni Members
**Track:**
- Vote participation (shows continued interest)
- Memory reactions/comments

**Don't penalize:**
- Low attendance (expected for alumni)

**Actions:**
- Occasional check-ins: "How's life in Seattle?"
- Invite to virtual events only

---

## Implementation Details

### Database Schema

**GuildMemberRole:**
```prisma
model GuildMemberRole {
  id          String   @id
  guildId     String
  userId      String   // Discord user ID
  roleId      String   // Discord role ID
  roleName    String   // Cached name

  @@unique([guildId, userId, roleId])
}
```

**Poll with location type:**
```prisma
model Poll {
  // ...
  locationType EventLocationType @default(IN_PERSON)
}

enum EventLocationType {
  IN_PERSON
  VIRTUAL
  HYBRID
}
```

### Engagement Service

```typescript
// Get engagement for all local members
const engagement = await getGuildEngagement(guildId, localRoleId);

// Filter shows:
engagement.forEach(user => {
  console.log(user.roles);  // ['Local', 'Core']
  console.log(user.lastInteractionAt);  // Any participation
  console.log(user.totalVirtualEvents);  // Remote participation
});
```

### Drift Risk Calculation

**Old (flawed):**
```typescript
daysSince = min(lastVotedAt, lastAttendedAt)
if (daysSince > 60) → HIGH RISK  ❌ Penalizes remote members
```

**New (fair):**
```typescript
daysSince = lastInteractionAt  // Includes votes, memories, attendance
if (daysSince > 60) → HIGH RISK  ✅ Fair to all participation types
```

---

## Future Enhancements

### Auto-suggest Role Changes
```
💡 Sarah hasn't attended in 6 months but votes regularly.
   Maybe update her role to @Remote?
   [Yes] [No] [Ask Sarah]
```

### Role-Specific Event Invites
```
/event create "Game Night" location:IN_PERSON invite:@Local
→ Only invites local members

/event create "Movie Watch Party" location:VIRTUAL invite:@Remote,@Alumni
→ Invites remote folks only
```

### Participation Heatmaps
```
📊 Engagement by Role:
@Local:  ████████░░ 80% active (16/20)
@Remote: ██████░░░░ 60% active (3/5)
@Alumni: ████░░░░░░ 40% active (2/5)
```

### Smart Reminders
```
🔔 3 @Remote members haven't been invited to virtual events in 30 days.
   Consider organizing: /event create "Virtual Hangout" location:VIRTUAL
```

---

## Best Practices

### 1. Segment Your Community
- **Local** - Can attend in-person
- **Remote** - Virtual only
- **Hybrid** - Sometimes visits, mostly remote
- **Alumni** - Moved away, casual engagement

### 2. Create Appropriate Events
- **Weekly game nights** → IN_PERSON, invite @Local
- **Monthly virtual catch-up** → VIRTUAL, invite @Remote + @Alumni
- **Special occasions** → HYBRID, invite everyone

### 3. Review Engagement by Role Monthly
```
/engagement drifting role:@Local
/engagement drifting role:@Remote
```

### 4. Don't Compare Across Roles
- Local members: 5 events/month is normal
- Remote members: 5 votes/month is great engagement
- Alumni: Any participation is success

### 5. Update Roles When Life Changes
- Member moves away? Change to @Remote
- Alumni moves back? Change to @Local
- Keep roles current for accurate tracking

---

## Migration Guide

### For Existing Communities

**Step 1:** Create roles
```
@Local, @Remote, @Alumni
```

**Step 2:** Assign roles to all members
Based on their typical participation patterns.

**Step 3:** Run initial engagement check
```
/engagement stats role:@Local
/engagement stats role:@Remote
```

**Step 4:** Reach out to drifting members
Use role-filtered drifting reports.

**Step 5:** Start marking event types
- Old in-person events → Already default IN_PERSON
- Create some VIRTUAL events for remote folks

---

## FAQ

**Q: Do I have to use roles?**
A: No. Without role filtering, engagement tracking works as before (all members).

**Q: Can members have multiple roles?**
A: Yes! Someone can be @Local + @Core + @Admin. Filtering shows them in any selected role.

**Q: What if someone moves from Local to Remote?**
A: Update their role in Discord. Historical data stays, but future engagement judged by new role.

**Q: How do I track virtual event attendance?**
A: Mark event as VIRTUAL or HYBRID. When finalized, attendees get `totalVirtualEvents` incremented.

**Q: Can I see who's engaging virtually vs in-person?**
A: Yes! User stats show:
- `totalEventsAttended` (in-person)
- `totalVirtualEvents` (virtual)

---

## Examples

### Example 1: Hybrid Friend Group
**Roles:**
- @Local (15 members in SF)
- @Remote (5 members scattered)

**Monthly check:**
```
/engagement drifting role:@Local
→ Shows 2 local members drifting
   "Mike and Sarah haven't attended in 45 days"

/engagement drifting role:@Remote
→ Shows 1 remote member drifting
   "Alex stopped voting 65 days ago"
```

**Actions:**
- DM Mike & Sarah for in-person hangout
- DM Alex: "Want to join virtual game night?"

### Example 2: College Alumni Group
**Roles:**
- @InTown (still in college city)
- @Moved (graduated, moved away)

**Check engagement:**
```
/engagement stats role:@InTown
→ 85% active, healthy local scene

/engagement stats role:@Moved
→ 40% active (expected for alumni)
→ Focus on virtual events to boost
```

### Example 3: Gaming Community
**Roles:**
- @Hardcore (plays daily)
- @Casual (occasional)

**Different thresholds:**
- @Hardcore drifting: 10 days inactive
- @Casual drifting: 60 days inactive

Use role filtering to apply appropriate expectations.

---

**Bottom line:** Stops penalizing remote members. Tracks diverse participation types. Enables fair, role-appropriate friendship health monitoring.
