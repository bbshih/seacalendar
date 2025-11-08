#!/usr/bin/env node

/**
 * Secure Branch Watcher for Claude Code
 *
 * Polls GitHub (via local git) for new Claude branches
 * No external services, no data exposure
 *
 * Usage:
 *   npm run watch              # Watch and notify
 *   npm run watch:auto         # Auto-checkout new branches
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const POLL_INTERVAL = 60000; // 60 seconds
const STATE_FILE = path.join(__dirname, '..', '.claude-sync-state.json');
const AUTO_SYNC = process.env.AUTO_SYNC === 'true';

// Load previous state
let state = { lastBranch: null, lastCommit: null, checkedBranches: [] };
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (error) {
    console.error('⚠️  Failed to load state file, starting fresh');
  }
}

// Save state
function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('⚠️  Failed to save state:', error.message);
  }
}

// Execute git command safely
function gitCommand(cmd, options = {}) {
  try {
    return execSync(`git ${cmd}`, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    }).trim();
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`❌ Git command failed: ${cmd}`);
      console.error(error.message);
    }
    return null;
  }
}

// Play notification sound (macOS/Linux)
function playNotification() {
  try {
    if (process.platform === 'darwin') {
      execSync('afplay /System/Library/Sounds/Glass.aiff', { stdio: 'ignore' });
    } else if (process.platform === 'linux') {
      execSync('paplay /usr/share/sounds/freedesktop/stereo/complete.oga', {
        stdio: 'ignore'
      });
    }
  } catch (error) {
    // Ignore sound errors
  }
}

// Check for new Claude branches
function checkForNewBranches() {
  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Checking for new Claude branches...`);

  // Fetch latest from GitHub (secure, using your credentials)
  const fetchResult = gitCommand('fetch origin', { silent: true });
  if (fetchResult === null) {
    console.log('  ⚠️  Failed to fetch from origin');
    return;
  }

  // Get all claude/* branches
  const branchList = gitCommand('branch -r', { silent: true });
  if (!branchList) {
    console.log('  ❌ Failed to list branches');
    return;
  }

  const claudeBranches = branchList
    .split('\n')
    .map(b => b.trim())
    .filter(b => b.includes('origin/claude/'))
    .map(b => b.replace('origin/', ''));

  if (claudeBranches.length === 0) {
    console.log('  ✅ No Claude branches found');
    return;
  }

  // Find new branches (not yet checked)
  const newBranches = claudeBranches.filter(
    branch => !state.checkedBranches.includes(branch)
  );

  if (newBranches.length === 0) {
    // Check if existing branches have new commits
    const latestBranch = claudeBranches[claudeBranches.length - 1];
    const latestCommit = gitCommand(
      `rev-parse origin/${latestBranch}`,
      { silent: true }
    );

    if (latestCommit && latestCommit !== state.lastCommit) {
      console.log(`  🔄 New commits on ${latestBranch}`);
      handleNewBranch(latestBranch, latestCommit, false);
    } else {
      console.log('  ✅ No new branches or commits');
    }
    return;
  }

  // Handle new branches
  console.log(`\n🚨 NEW CLAUDE BRANCHES DETECTED!\n`);
  newBranches.forEach(branch => {
    console.log(`  ${branch}`);
    const commit = gitCommand(`rev-parse origin/${branch}`, { silent: true });
    handleNewBranch(branch, commit, true);
  });

  playNotification();
}

// Handle a new or updated branch
function handleNewBranch(branch, commit, isNew) {
  // Show changes
  console.log(`\n  📊 Changes in ${branch}:`);
  const baseCommit = state.lastCommit || 'main';
  gitCommand(`diff ${baseCommit}...origin/${branch} --stat`);

  // Show commit messages
  console.log(`\n  📝 Recent commits:`);
  gitCommand(`log ${baseCommit}..origin/${branch} --oneline --max-count=5`);

  // Auto-sync if enabled
  if (AUTO_SYNC) {
    console.log(`\n  🔄 Auto-syncing ${branch}...`);

    // Checkout branch
    gitCommand(`checkout ${branch}`);

    // Install dependencies
    console.log(`  📦 Installing dependencies...`);
    execSync('npm install', { stdio: 'inherit' });

    // Run migrations if schema changed
    const files = gitCommand(
      `diff --name-only ${baseCommit}...origin/${branch}`,
      { silent: true }
    );

    if (files && files.includes('schema.prisma')) {
      console.log(`  🗄️  Database schema changed, running migrations...`);
      execSync('npm run db:migrate:dev', { stdio: 'inherit' });
    }

    console.log(`\n  ✅ Synced! Run: npm run dev`);
  } else {
    console.log(`\n  📥 To sync: git checkout ${branch} && npm install`);
    console.log(`  Or run: npm run watch:auto (auto-sync enabled)`);
  }

  // Update state
  state.lastBranch = branch;
  state.lastCommit = commit;
  if (isNew && !state.checkedBranches.includes(branch)) {
    state.checkedBranches.push(branch);
  }
  saveState();
}

// Cleanup old branches from state
function cleanupState() {
  const allBranches = gitCommand('branch -r', { silent: true });
  if (!allBranches) return;

  const existingBranches = allBranches
    .split('\n')
    .map(b => b.trim().replace('origin/', ''))
    .filter(b => b.includes('claude/'));

  state.checkedBranches = state.checkedBranches.filter(
    branch => existingBranches.includes(branch)
  );
  saveState();
}

// Main execution
console.log('SeaCalendar - Claude Branch Watcher\n');
console.log('👀 Watching for Claude Code pushes...');
console.log(`⏱️  Polling every ${POLL_INTERVAL / 1000} seconds`);
console.log(`${AUTO_SYNC ? '🔄 Auto-sync: ENABLED' : '📋 Auto-sync: DISABLED (manual sync)'}\n`);
console.log('Press Ctrl+C to stop\n');

// Initial check
checkForNewBranches();

// Cleanup state every hour
setInterval(cleanupState, 3600000);

// Poll for changes
setInterval(checkForNewBranches, POLL_INTERVAL);
