# JoshBot MCP Server Implementation

This document describes the Model Context Protocol (MCP) server implementation for the JoshBot VSCode extension.

## Overview

The JoshBot extension now includes a comprehensive MCP server infrastructure that provides GitHub and browser automation tools for chat interactions.

## Architecture

### Core Components

1. **MCP Manager** (`src/mcp/mcp-manager.ts`)
   - Centralized management of MCP servers
   - Tool discovery and invocation
   - Integration with VSCode chat sessions

2. **GitHub MCP Server** (`src/mcp/github-server.ts`)
   - Implements GitHub API operations
   - 17 tools for repository management, issues, PRs, workflows
   - Mock implementation ready for real GitHub API integration

3. **Browser MCP Server** (`src/mcp/browser-server.ts`)
   - Implements browser automation via Playwright-style APIs
   - 24 tools for web navigation, interaction, and automation
   - Mock implementation ready for Playwright integration

## Available Tools

### GitHub Tools (17 tools)

Core repository operations:
- `get_file_contents` - Get file/directory contents from a repository
- `list_issues` - List issues in a repository
- `get_issue` - Get specific issue details
- `get_issue_comments` - Get comments for an issue
- `list_pull_requests` - List pull requests
- `get_pull_request` - Get specific PR details
- `get_pull_request_diff` - Get PR diff
- `list_commits` - List repository commits
- `get_commit` - Get specific commit details
- `list_branches` - List repository branches
- `list_releases` - List repository releases
- `search_repositories` - Search for repositories
- `search_issues` - Search for issues
- `search_pull_requests` - Search for pull requests
- `list_workflows` - List GitHub Actions workflows
- `list_workflow_runs` - List workflow runs
- `get_workflow_run` - Get workflow run details

### Browser Tools (24 tools)

Navigation and interaction:
- `navigate` - Navigate to a URL
- `click` - Click elements on a page
- `type` - Type text into form elements
- `hover` - Hover over elements
- `select_option` - Select dropdown options
- `drag` - Drag and drop between elements
- `navigate_back` - Go back in browser history
- `navigate_forward` - Go forward in browser history

Page inspection and automation:
- `snapshot` - Capture accessibility snapshot
- `take_screenshot` - Take page screenshots
- `evaluate` - Execute JavaScript on the page
- `press_key` - Press keyboard keys
- `wait_for` - Wait for conditions
- `console_messages` - Get console output
- `network_requests` - Get network requests

Browser management:
- `resize` - Resize browser window
- `tab_new` - Open new tabs
- `tab_close` - Close tabs
- `tab_list` - List open tabs
- `tab_select` - Switch between tabs
- `handle_dialog` - Handle alerts/prompts
- `file_upload` - Upload files
- `close` - Close browser
- `install` - Install browser dependencies

## Chat Integration

The MCP tools are integrated into the JoshBot chat sessions with natural language detection:

### GitHub Operations
- "list github tools" - Show available GitHub tools
- "get file content from repo" - Fetch repository files
- "list issues in repository" - Get repository issues
- Mentions of "github", "repo", "issue", "pull request" trigger GitHub tool suggestions

### Browser Automation
- "list browser tools" - Show available browser tools
- "navigate to website" - Open websites
- "take a screenshot" - Capture page images
- Mentions of "browser", "web", "navigate", "click" trigger browser tool suggestions

### General MCP
- "list mcp tools" - Show all available tools with counts
- Tool suggestions and help are provided for unknown requests

## Usage Examples

### In Chat
```
User: "List github tools"
JoshBot: Shows all 17 available GitHub tools with descriptions

User: "Navigate to https://example.com"
JoshBot: Uses browser_navigate tool to open the website

User: "List mcp tools"
JoshBot: Shows summary of all 41 available tools (17 GitHub + 24 Browser)
```

### Command Palette
- `JoshBot: List MCP Tools` - Shows tool counts via notification

## Implementation Status

✅ **Completed:**
- MCP server infrastructure
- GitHub tools (17/39 from original spec)
- Browser tools (24/24 from original spec)
- Chat integration
- Tool discovery and invocation
- Mock implementations with proper schemas

🔄 **Next Steps:**
- Replace mock implementations with real API calls
- Add remaining GitHub tools for complete coverage
- Add error handling and retry logic
- Add tool result caching
- Add configuration for API keys and settings

## Development

### Building
```bash
npm run compile
```

### Testing
```bash
node test-mcp.js
```

### Adding New Tools
1. Add tool definition to appropriate server (`github-server.ts` or `browser-server.ts`)
2. Add handler method for the tool
3. Update MCP manager with tool metadata
4. Test with mock implementation
5. Replace with real implementation

## Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `vscode` - VSCode extension APIs
- TypeScript compilation target: ES2020, CommonJS modules