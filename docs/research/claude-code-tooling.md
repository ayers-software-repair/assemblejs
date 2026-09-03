# Claude Code Repository Tooling Reference

**Date:** 2026-09-03  
**Sources:** Official Claude Code documentation fetched from https://code.claude.com/docs/en/

## 1. CLAUDE.md — Persistent Memory

**File paths:** `./CLAUDE.md`, `./.claude/CLAUDE.md`, or `./CLAUDE.local.md`

**Scope & Precedence (top-to-bottom, later overrides earlier):**

1. Managed policy (organization-wide, at system level)
2. User instructions (`~/.claude/CLAUDE.md`)
3. Project instructions (`.claude/CLAUDE.md` or `./CLAUDE.md`)
4. Local instructions (`./CLAUDE.local.md`, git-ignored)

**Load order:** Files at or above working directory load at startup. Subdirectory files load on-demand when Claude reads files there. Per-directory CLAUDE.md files inherit ancestor instructions.

**Current guidance:**

- **Target size:** under 200 lines per file (longer = reduced adherence)
- **Content:** coding standards, build commands, architectural decisions, naming conventions, gotchas, project layout, **not** derivable from code
- **Structure:** markdown headers + bullets, concise and specific
- **Imports:** `@path/to/file` syntax loads additional files at launch (relative to importing file, recursive up to 4 hops, skips markdown code blocks)
- **Status:** `CLAUDE.local.md` is current and supported (git-ignored for personal notes)
- **Compaction survival:** project-root CLAUDE.md survives `/compact` and re-injects; nested files reload on-demand

**Tool check:** Run `/context` → **Memory files** section to verify what loaded.

**URL:** https://code.claude.com/docs/en/memory.md

---

## 2. .claude/settings.json — Configuration Schema

**File paths (precedence):**

1. Local `./.claude/settings.local.json` (highest)
2. Project `./.claude/settings.json`
3. User `~/.claude/settings.json`
4. Managed policy (lowest)

**Full schema:** 200+ keys, interactive reference at https://code.claude.com/docs/en/settings-reference.md

**Essential categories & current keys (2026):**

| Category        | Keys                                                                     | Example                                                           |
| --------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Model**       | `model`, `availableModels`, `fastMode`, `effortLevel`                    | `"model": "claude-opus-5"`                                        |
| **Permissions** | `permissions.allow[]`, `.deny[]`, `.ask[]`, `autoMode`, `defaultMode`    | `"permissions": {"allow": ["Bash(git commit *)"]}`                |
| **Memory**      | `autoMemoryEnabled`, `autoMemoryDirectory`, `claudeMdExcludes[]`         | `"autoMemoryEnabled": true`                                       |
| **MCP**         | `allowedMcpServers[]`, `deniedMcpServers[]`, `disableClaudeAiConnectors` | `"allowedMcpServers": [{"serverUrl": "http://..."}]`              |
| **Plugins**     | `enabledPlugins{}`, `extraKnownMarketplaces{}`, `skillOverrides{}`       | `"enabledPlugins": {"code-review@claude-plugins-official": true}` |
| **Sandbox**     | `sandbox.enabled`, `.filesystem`, `.network.allowedDomains[]`            | `"sandbox": {"enabled": true}`                                    |
| **Hooks**       | `hooks{}` (event → array of rules)                                       | See section 3                                                     |
| **Output**      | `outputStyle`                                                            | `"outputStyle": "Concise"`                                        |
| **Status**      | `statusLine`                                                             | `{"type": "command", "command": "..."}`                           |
| **Attribution** | `attribution.commit`, `.pr`                                              | `"attribution": {"commit": "..."}`                                |
| **Env**         | `env{}` (custom vars)                                                    | `"env": {"VAR": "value"}`                                         |

**Removed/Deprecated keys (v2.1.257 and later):**

- `disableArtifact` → use `enableArtifact: false`
- `includeCoAuthoredBy` → use `attribution` settings
- `permissionExplainerEnabled` → removed
- `disableInlineArtifacts` → use artifact controls

**Permissions schema:**

```json
{
  "permissions": {
    "defaultMode": "ask",
    "allow": ["Bash(git diff *)", "Read(~/.zshrc)"],
    "ask": ["Bash(npm publish *)"],
    "deny": ["Write(.env)", "Bash(rm -rf *)"]
  }
}
```

**URL:** https://code.claude.com/docs/en/settings-reference.md  
**Example configurations:** https://code.claude.com/docs/en/settings-example.md

---

## 3. Hooks — Event Automation

**File location:** `hooks` key in `.claude/settings.json` (or `.claude/settings.local.json`)

**Current hook events (all documented 2026-09-03):**

- `PreToolUse`: before tool execution, can block
- `PostToolUse`: after tool succeeds, cannot block
- `PostToolUseFailure`: after tool fails, cannot block
- `PermissionRequest`: on tool permission decision, can decide
- `PermissionDenied`: after permission denial, can retry
- `UserPromptSubmit`: before prompt processes, can block/modify
- `Stop`: when Claude finishes, can block to continue
- `SessionStart`: at startup, can inject context
- `SessionEnd`: session closes
- `PreModelSwitch` / `PostModelSwitch`: model change
- `PreCompact` / `PostCompact`: context compaction
- `Notification`: when Claude needs input (permission_prompt, idle_prompt, auth_success, elicitation__, agent_needs_input, agent_completed, quota_auto_resume__)
- `ConfigChange`: settings file changes
- `FileChanged`: monitored file changes
- `SubagentStop` / `SubagentStart`: subagent lifecycle
- `PreToolBatch`: before multiple tools

**JSON Input (all events receive):**

```json
{
  "session_id": "abc123",
  "prompt_id": "uuid",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/working/directory",
  "permission_mode": "ask|plan|auto|dontAsk|bypassPermissions",
  "hook_event_name": "PreToolUse",
  "effort": { "level": "low|medium|high|xhigh|max" },
  "agent_id": "subagent-id",
  "agent_type": "Explore|custom"
}
```

**JSON Output (structured control):**

```json
{
  "hookSpecificOutput": {
    "permissionDecision": "allow|deny",
    "permissionDecisionReason": "reason text",
    "additionalContext": "context for Claude",
    "updatedInput": { "modified": "input" },
    "retry": true,
    "systemMessage": "message to show"
  }
}
```

**Exit codes:**

- `0`: success, parse JSON output for control
- `2`: blocking error (prevents action)
- Other: non-blocking, valid JSON output can still control behavior

**Matcher syntax:** `PreToolUse`, `Edit|Write`, glob patterns for file paths, empty string for all

**Environment variable:** `$CLAUDE_PROJECT_DIR` resolves to project root (same for MCP)

**Hook types:**

- `type: "command"` - shell script, stdin/stdout
- `type: "http"` - POST to URL
- `type: "mcp_tool"` - call MCP tool
- `type: "prompt"` - send to Claude
- `type: "agent"` - spawn subagent

**URL:** https://code.claude.com/docs/en/hooks.md

---

## 4. Subagents — Custom Agents

**File location:** `.claude/agents/*.md` (one per agent)

**Frontmatter fields:**

```yaml
---
name: agent-name # required: lowercase, hyphens
description: when to use # required
tools: Read, Grep, Bash # optional: allowlist
disallowedTools: Write, Edit # optional: denylist
model: opus|sonnet|haiku|inherit # optional
permissionMode: ask|auto|dontAsk # optional
maxTurns: 10 # optional
skills: [skill-name] # optional: preload skills
mcpServers: [name] # optional: scoped MCP
hooks: { ... } # optional
memory: user|project|local # optional: persistent memory
background: true|false # optional: run in background
effort: low|medium|high|xhigh|max # optional: effort override
isolation: worktree # optional: git worktree isolation
color: hex-color # optional: display color
initialPrompt: text # optional: auto-submit first turn
experimental: { cacheTtl: ms } # optional: experimental features
---
```

**Tool inheritance:**

- Always removed: `Agent` (at depth limit), `AskUserQuestion`, `EndConversation`, `EnterPlanMode`, `ExitPlanMode`, `ScheduleWakeup`, `TaskOutput`, `WaitForMcpServers`, `Workflow`
- Background subagents keep: read/write tools, Bash, WebFetch, WebSearch, MCP tools only
- Foreground subagents inherit full tool set minus Filter 1

**When to commit:**
✓ Team-specific workflows, project-critical tasks (code review, security), shared domain knowledge  
✗ Personal workflows, experiments, sensitive configs

**URL:** https://code.claude.com/docs/en/sub-agents.md

---

## 5. Skills — On-Demand Knowledge & Workflows

**File location:** `.claude/skills/<skill-name>/SKILL.md` (or `.claude/commands/name.md` for flat format, deprecated)

**Frontmatter fields:**

```yaml
---
name: skill-name # optional: display name
description: what it does # recommended: use for auto-load
when_to_use: trigger phrases # optional: additional context
argument-hint: [arg-hint] # optional: autocomplete hint
arguments: [arg1, arg2] # optional: named args for $name
disable-model-invocation: true # optional: manual-only
user-invocable: false # optional: Claude-only
allowed-tools: Bash(git *) # optional: permission grant
disallowed-tools: Write # optional: remove tools
model: opus|inherit # optional
effort: low|medium|high|xhigh|max # optional
context: fork # optional: isolated subagent
agent: Explore|Plan|general # optional: subagent type
background: true|false # optional: foreground wait (v2.1.218+)
hooks: { ... } # optional
paths: ["src/**/*.ts"] # optional: glob patterns for auto-load
shell: bash|powershell # optional: injection shell
metadata: { ... } # optional: custom key-value
license: MIT # optional: per Agent Skills spec
compatibility: string # optional: per Agent Skills spec
---
```

**Dynamic context (injected before Claude sees skill):**

- `` !`shell command` `` - inline command, output replaces placeholder
- ` ```! ` ... ` ``` ` - multi-line command block
- `!` must be at line start or after whitespace

**String substitutions:**

- `$ARGUMENTS` - all arguments
- `$ARGUMENTS[N]` / `$N` - indexed arg (0-based)
- `$name` - named arg from `arguments:` field
- `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`

**Differences from subagents & commands:**

- Skills load on-demand (command-invoked or auto-detected by Claude)
- Commands are flat files (deprecated in favor of skills)
- Subagents are persistent agent definitions for delegation
- Skills ⊂ plugins (skills namespace as `plugin-name:skill-name`)

**URL:** https://code.claude.com/docs/en/skills.md

---

## 6. Slash Commands — CLI Interface

**File location:** `.claude/commands/*.md` or `.claude/skills/*/SKILL.md` (skills are current, commands deprecated but working)

**Invocation:** `/command-name [args]`

**Frontmatter (same as skills):**

```yaml
---
description: what it does
allowed-tools: Bash(*)
---
```

**Argument syntax (from skills):**

- `$ARGUMENTS` - all text after command
- `$ARGUMENTS[0]`, `$1`, `$2` - indexed by position
- `$name` (if `arguments: [name]` in frontmatter)
- Support for @file-references and shell injection via `!`

**Stack multiple skills:** `/skill-a /skill-b do something` (up to 6 skills, v2.1.199+)

**URL:** https://code.claude.com/docs/en/skills.md (commands redirects there)

---

## 7. Plugins — Packaged Extensions

**What is a plugin:** self-contained directory with manifest, skills, agents, hooks, MCP servers, LSP servers, monitors

**plugin.json schema (`.claude-plugin/plugin.json`):**

```json
{
  "name": "my-plugin",
  "description": "what it does",
  "version": "1.0.0",
  "author": { "name": "Your Name" },
  "homepage": "https://...",
  "repository": "https://...",
  "license": "MIT"
}
```

**Plugin directory structure:**

```
my-plugin/
├── .claude-plugin/plugin.json    # manifest
├── skills/
│   └── skill-name/SKILL.md
├── agents/
│   └── agent-name.md
├── hooks/hooks.json
├── .mcp.json
├── .lsp.json
├── monitors/monitors.json
├── output-styles/style.md
├── bin/                          # added to PATH
└── settings.json                 # defaults on enable
```

**When to commit plugin to repo:** usually no. Plugins are for sharing via marketplaces. Commit `.claude/skills/`, `.claude/agents/`, hooks to `.claude/settings.json` instead for team-internal use. A plugin at repo root can load with `--plugin-dir .` for testing.

**Testing locally:** `claude --plugin-dir ./my-plugin` or `--plugin-url https://...`

**Sharing:** publish to marketplace (Anthropic community or private)

**URL:** https://code.claude.com/docs/en/plugins.md

---

## 8. Output Styles & Statusline

**Output styles:**

- **Commit?** Yes, to `.claude/output-styles/` (project-level)
- **Relevance?** For public OSS: only if guiding a particular response mode (e.g., "Concise for CI environments")
- **Example:** `.claude/output-styles/concise.md`
- **Built-in options:** Default, Proactive, Concise, Explanatory, Learning
- **Frontmatter:**
  ```yaml
  ---
  name: style-name
  description: description
  keep-coding-instructions: true
  ---
  ```

**Statusline:**

- **Commit?** No (personal preference)
- **Relevance?** No (user-specific monitoring)
- **Location:** `~/.claude/settings.json` only

**URL:** https://code.claude.com/docs/en/output-styles.md, https://code.claude.com/docs/en/statusline.md

---

## 9. GitHub Actions — Preventing API Budget Burnout

**Action location:** `anthropics/claude-code-action@v1` (not beta)

**Cost controls & fork PR safety:**

1. **Fork PR behavior:** On public repos, GitHub withholds secrets from fork PR runs → API key/token not available → run fails safely. No risk of outside contributor burning budget.

2. **Cost limits in workflow:**

   ```yaml
   - uses: anthropics/claude-code-action@v1
     with:
       anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
       prompt: "your prompt"
       claude_args: "--max-turns 5" # limit iterations
   ```
   - `--max-turns N`: max agentic turns
   - Set workflow-level timeout to avoid runaway jobs
   - Use `--model` to select model (cost varies by model)

3. **Who can trigger:**
   - Interactive mode (`@claude` mention): user must have write access to repo (default)
   - Automation mode (scheduled or direct prompt): GitHub runs it on repo owner's account, not contributor
   - Override with `allowed_non_write_users` + custom `github_token` if needed
   - Reject bot actors unless listed in `allowed_bots`

4. **Best practices:**
   - Use scheduled workflows (`cron`) for routine tasks to centralize cost
   - Add `gh` CLI pre-approval (GitHub MCP) for common tasks
   - Lock down secrets at org level, share via org Actions secrets
   - Monitor usage via GitHub Actions cost dashboard

**URL:** https://code.claude.com/docs/en/github-actions.md

---

## 10. Best Practices for Public OSS

**From best-practices.md + common-workflows.md:**

1. **Write effective CLAUDE.md:**
   - Bash commands Claude can't guess
   - Code style rules that differ from defaults
   - Repository etiquette (branch naming, PR conventions)
   - Architectural decisions
   - Developer environment quirks (required env vars)
   - Common gotchas
   - Exclude: anything Claude can derive from code, API docs (link instead), self-evident advice

2. **Provide verification:**
   - Tests, build, linter, screenshots
   - Run checks in the prompt: "implement X, run tests, fix failures"
   - Use `/goal` for persistent verification across turns
   - Use `/verify` skill to validate changes against running app

3. **Scope & plan:**
   - Use plan mode for large changes
   - Separate exploration (read-only) from implementation
   - Point Claude to specific files, patterns, edge cases
   - Reference examples in the codebase

4. **Permissions & sandbox:**
   - Pre-approve read-only tools (`git diff`, `grep`)
   - Deny secrets (`.env`, `.secrets`)
   - Use sandbox for network access control
   - Set `autoMode: true` for unattended runs on Pro/Max/Team plans

5. **Skills for team patterns:**
   - API-specific testing patterns
   - Deploy checklist
   - Common migrations
   - Place in `.claude/skills/` committed to repo

6. **Monorepos:**
   - Per-package CLAUDE.md files
   - `claudeMdExcludes` to hide irrelevant packages
   - Deny `Read` rules for build output and vendor code
   - Use code intelligence plugin (LSP) to avoid file scans
   - Sparse worktrees with `worktree.sparsePaths`

7. **Hooks for determinism:**
   - Format after edits (PostToolUse + prettier)
   - Block destructive commands (PreToolUse + rm check)
   - Linting gates (Stop hook runs linter, blocks turn if fails)

**URL:** https://code.claude.com/docs/en/best-practices.md, https://code.claude.com/docs/en/common-workflows.md

---

## What NOT to Do (Cargo Cult Configs to Avoid)

**NOT in official docs:**

- `.claude/ai.json` (not a thing; use settings.json)
- Manual `.claude/index.json` (managed automatically)
- `CLAUDE.env` files (use `env` key in settings.json)
- Committing OAuth tokens or API keys (use GitHub Secrets)
- `--no-verify` on git commits (Claude Code doesn't use this flag; hooks are deterministic)
- `@claude` attribution in commits (explicitly forbidden; see workspace law in project CLAUDE.md)

**Removed or deprecated:**

- `includeCoAuthoredBy` setting (use `attribution` instead)
- `permissionExplainerEnabled` (removed v2.1.257+)
- `.claude/commands/` (works but skills are current standard)
- `CLAUDE.local.md` deprecated status (false; it's current)
- `--prompt-cache` CLI flag (prompt caching is automatic, no flag needed)

---

## Summary: What a Serious Public OSS Should Commit

**MUST or SHOULD HAVE:**

1. `CLAUDE.md` (or `.claude/CLAUDE.md`) — build, test, coding standards, gotchas
2. `.claude/settings.json` — permissions (deny secrets), allow (read-only), hooks if any
3. `.claude/rules/` (optional) — path-scoped rules if monorepo or large
4. `.claude/skills/` (optional) — repeatable team workflows
5. `.claude/agents/` (optional) — specialized review or exploration agents
6. `.github/workflows/claude.yml` (optional) — GitHub Action with cost controls
7. `.gitignore` → `.claude/settings.local.json` (user-level, not committed)

**DO NOT COMMIT:**

- Output styles (personal preference)
- Statusline config (personal preference)
- Plugins (share via marketplace, not repo)
- `.env`, credentials, API keys (use GitHub Secrets)
- `.claude.json` (desktop-only, not repo config)

---

## References

| Topic              | URL                                                   |
| ------------------ | ----------------------------------------------------- |
| Memory (CLAUDE.md) | https://code.claude.com/docs/en/memory.md             |
| Settings schema    | https://code.claude.com/docs/en/settings-reference.md |
| Settings example   | https://code.claude.com/docs/en/settings-example.md   |
| Hooks              | https://code.claude.com/docs/en/hooks.md              |
| Hooks guide        | https://code.claude.com/docs/en/hooks-guide.md        |
| Subagents          | https://code.claude.com/docs/en/sub-agents.md         |
| Skills             | https://code.claude.com/docs/en/skills.md             |
| Plugins            | https://code.claude.com/docs/en/plugins.md            |
| Plugins reference  | https://code.claude.com/docs/en/plugins-reference.md  |
| GitHub Actions     | https://code.claude.com/docs/en/github-actions.md     |
| Output styles      | https://code.claude.com/docs/en/output-styles.md      |
| Statusline         | https://code.claude.com/docs/en/statusline.md         |
| Best practices     | https://code.claude.com/docs/en/best-practices.md     |
| Common workflows   | https://code.claude.com/docs/en/common-workflows.md   |
| Monorepos          | https://code.claude.com/docs/en/large-codebases.md    |
| CLI reference      | https://code.claude.com/docs/en/cli-reference.md      |
