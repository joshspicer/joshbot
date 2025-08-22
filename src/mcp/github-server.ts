import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolRequest,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

interface GitHubToolParams {
  owner?: string;
  repo?: string;
  [key: string]: any;
}

class GitHubMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'github-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      return this.handleToolCall(request);
    });
  }

  private getAvailableTools(): Tool[] {
    return [
      {
        name: 'github-mcp-server-get_file_contents',
        description: 'Get the contents of a file or directory from a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner (username or organization)' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'Path to file/directory', default: '/' },
            ref: { type: 'string', description: 'Git ref (branch, tag, commit SHA)' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-list_issues',
        description: 'List issues in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['OPEN', 'CLOSED'], description: 'Filter by state' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Filter by labels' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-get_issue',
        description: 'Get details of a specific issue in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            issue_number: { type: 'number', description: 'The number of the issue' },
          },
          required: ['owner', 'repo', 'issue_number'],
        },
      },
      {
        name: 'github-mcp-server-get_issue_comments',
        description: 'Get comments for a specific issue in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            issue_number: { type: 'number', description: 'Issue number' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo', 'issue_number'],
        },
      },
      {
        name: 'github-mcp-server-list_pull_requests',
        description: 'List pull requests in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Filter by state' },
            base: { type: 'string', description: 'Filter by base branch' },
            head: { type: 'string', description: 'Filter by head user/org and branch' },
            sort: { type: 'string', enum: ['created', 'updated', 'popularity', 'long-running'], description: 'Sort by' },
            direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-get_pull_request',
        description: 'Get details of a specific pull request in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            pullNumber: { type: 'number', description: 'Pull request number' },
          },
          required: ['owner', 'repo', 'pullNumber'],
        },
      },
      {
        name: 'github-mcp-server-get_pull_request_comments',
        description: 'Get comments for a specific pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            pullNumber: { type: 'number', description: 'Pull request number' },
          },
          required: ['owner', 'repo', 'pullNumber'],
        },
      },
      {
        name: 'github-mcp-server-get_pull_request_diff',
        description: 'Get the diff of a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            pullNumber: { type: 'number', description: 'Pull request number' },
          },
          required: ['owner', 'repo', 'pullNumber'],
        },
      },
      {
        name: 'github-mcp-server-get_pull_request_files',
        description: 'Get the files changed in a specific pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            pullNumber: { type: 'number', description: 'Pull request number' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo', 'pullNumber'],
        },
      },
      {
        name: 'github-mcp-server-list_commits',
        description: 'Get list of commits of a branch in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            sha: { type: 'string', description: 'Commit SHA, branch or tag name' },
            author: { type: 'string', description: 'Author username or email address to filter commits by' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-get_commit',
        description: 'Get details for a commit from a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            sha: { type: 'string', description: 'Commit SHA, branch name, or tag name' },
          },
          required: ['owner', 'repo', 'sha'],
        },
      },
      {
        name: 'github-mcp-server-list_branches',
        description: 'List branches in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-list_releases',
        description: 'List releases in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-get_latest_release',
        description: 'Get the latest release in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-search_repositories',
        description: 'Find GitHub repositories by name, description, readme, topics, or other metadata',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Repository search query with advanced search syntax' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['query'],
        },
      },
      {
        name: 'github-mcp-server-search_issues',
        description: 'Search for issues in GitHub repositories using issues search syntax',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query using GitHub issues search syntax' },
            sort: { type: 'string', enum: ['comments', 'reactions', 'created', 'updated'], description: 'Sort field' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['query'],
        },
      },
      {
        name: 'github-mcp-server-search_pull_requests',
        description: 'Search for pull requests in GitHub repositories',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query using GitHub pull request search syntax' },
            sort: { type: 'string', enum: ['comments', 'reactions', 'created', 'updated'], description: 'Sort field' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['query'],
        },
      },
      {
        name: 'github-mcp-server-list_workflows',
        description: 'List workflows in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'github-mcp-server-list_workflow_runs',
        description: 'List workflow runs for a specific workflow',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            workflow_id: { type: 'string', description: 'The workflow ID or workflow file name' },
            status: { type: 'string', enum: ['queued', 'in_progress', 'completed'], description: 'Filter by status' },
            branch: { type: 'string', description: 'Filter by branch' },
            event: { type: 'string', description: 'Filter by event type' },
            page: { type: 'number', minimum: 1, description: 'Page number for pagination' },
            perPage: { type: 'number', minimum: 1, maximum: 100, description: 'Results per page' },
          },
          required: ['owner', 'repo', 'workflow_id'],
        },
      },
      {
        name: 'github-mcp-server-get_workflow_run',
        description: 'Get details of a specific workflow run',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            run_id: { type: 'number', description: 'The unique identifier of the workflow run' },
          },
          required: ['owner', 'repo', 'run_id'],
        },
      },
      // Add more GitHub tools here as needed...
    ];
  }

  private async handleToolCall(request: CallToolRequest): Promise<any> {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case 'github-mcp-server-get_file_contents':
          return await this.getFileContents(args as GitHubToolParams);
        case 'github-mcp-server-list_issues':
          return await this.listIssues(args as GitHubToolParams);
        case 'github-mcp-server-get_issue':
          return await this.getIssue(args as GitHubToolParams);
        case 'github-mcp-server-list_pull_requests':
          return await this.listPullRequests(args as GitHubToolParams);
        case 'github-mcp-server-get_pull_request':
          return await this.getPullRequest(args as GitHubToolParams);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error calling ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getFileContents(params: GitHubToolParams) {
    const { owner, repo, path = '/', ref } = params;
    
    if (!owner || !repo) {
      throw new Error('owner and repo are required');
    }

    // Mock implementation - in real implementation, this would call GitHub API
    return {
      content: [
        {
          type: 'text',
          text: `Mock file contents for ${owner}/${repo}${path}${ref ? ` at ${ref}` : ''}`,
        },
      ],
    };
  }

  private async listIssues(params: GitHubToolParams) {
    const { owner, repo, state, labels, perPage = 30 } = params;
    
    if (!owner || !repo) {
      throw new Error('owner and repo are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock issues list for ${owner}/${repo} (state: ${state || 'all'}, labels: ${labels?.join(',') || 'none'}, perPage: ${perPage})`,
        },
      ],
    };
  }

  private async getIssue(params: GitHubToolParams) {
    const { owner, repo, issue_number } = params;
    
    if (!owner || !repo || !issue_number) {
      throw new Error('owner, repo, and issue_number are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock issue details for ${owner}/${repo}#${issue_number}`,
        },
      ],
    };
  }

  private async listPullRequests(params: GitHubToolParams) {
    const { owner, repo, state = 'open', base, head, sort, direction, perPage = 30 } = params;
    
    if (!owner || !repo) {
      throw new Error('owner and repo are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock pull requests list for ${owner}/${repo} (state: ${state}, base: ${base || 'any'}, head: ${head || 'any'}, sort: ${sort || 'created'}, direction: ${direction || 'desc'}, perPage: ${perPage})`,
        },
      ],
    };
  }

  private async getPullRequest(params: GitHubToolParams) {
    const { owner, repo, pullNumber } = params;
    
    if (!owner || !repo || !pullNumber) {
      throw new Error('owner, repo, and pullNumber are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock pull request details for ${owner}/${repo}#${pullNumber}`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP server running on stdio');
  }
}

// Run the server if this file is executed directly
if (require.main === module) {
  const server = new GitHubMCPServer();
  server.run().catch(console.error);
}

export { GitHubMCPServer };