import * as vscode from 'vscode';
import { GitHubMCPServer } from './github-server';
import { BrowserMCPServer } from './browser-server';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
  serverType: 'github' | 'browser';
}

export class MCPManager {
  private static instance: MCPManager;
  private githubServer: GitHubMCPServer;
  private browserServer: BrowserMCPServer;
  private isInitialized: boolean = false;

  private constructor() {
    this.githubServer = new GitHubMCPServer();
    this.browserServer = new BrowserMCPServer();
  }

  static getInstance(): MCPManager {
    if (!MCPManager.instance) {
      MCPManager.instance = new MCPManager();
    }
    return MCPManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize the MCP servers
      console.log('Initializing MCP servers...');
      this.isInitialized = true;
      
      // In a real implementation, we would start the servers as separate processes
      // and communicate with them via stdio or other transport mechanisms
      console.log('MCP servers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP servers:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async getAvailableTools(): Promise<MCPTool[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const githubTools = await this.getGitHubTools();
    const browserTools = await this.getBrowserTools();

    return [...githubTools, ...browserTools];
  }

  private async getGitHubTools(): Promise<MCPTool[]> {
    // Mock GitHub tools - in real implementation, this would query the GitHub MCP server
    return [
      {
        name: 'github-mcp-server-get_file_contents',
        description: 'Get the contents of a file or directory from a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'Path to file/directory', default: '/' },
            ref: { type: 'string', description: 'Git ref (branch, tag, commit SHA)' },
          },
          required: ['owner', 'repo'],
        },
        serverType: 'github',
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
          },
          required: ['owner', 'repo'],
        },
        serverType: 'github',
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
        serverType: 'github',
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
          },
          required: ['owner', 'repo', 'issue_number'],
        },
        serverType: 'github',
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
          },
          required: ['owner', 'repo'],
        },
        serverType: 'github',
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
        serverType: 'github',
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
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-list_commits',
        description: 'Get list of commits of a branch in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-get_commit',
        description: 'Get details for a commit from a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            sha: { type: 'string', description: 'Commit SHA' },
          },
          required: ['owner', 'repo', 'sha'],
        },
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-list_branches',
        description: 'List branches in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-list_releases',
        description: 'List releases in a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-search_repositories',
        description: 'Find GitHub repositories by name, description, readme, topics, or other metadata',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Repository search query' },
          },
          required: ['query'],
        },
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-search_issues',
        description: 'Search for issues in GitHub repositories',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query using GitHub issues search syntax' },
          },
          required: ['query'],
        },
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-search_pull_requests',
        description: 'Search for pull requests in GitHub repositories',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query for pull requests' },
          },
          required: ['query'],
        },
        serverType: 'github',
      },
      {
        name: 'github-mcp-server-list_workflows',
        description: 'List workflows in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
        serverType: 'github',
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
          },
          required: ['owner', 'repo', 'workflow_id'],
        },
        serverType: 'github',
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
        serverType: 'github',
      },
      // Additional GitHub tools would be listed here...
    ];
  }

  private async getBrowserTools(): Promise<MCPTool[]> {
    // Mock browser tools - in real implementation, this would query the browser MCP server
    return [
      {
        name: 'playwright-browser_navigate',
        description: 'Navigate to a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to navigate to' },
          },
          required: ['url'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_click',
        description: 'Perform click on a web page',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Button to click' },
          },
          required: ['element', 'ref'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_type',
        description: 'Type text into editable element',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference' },
            text: { type: 'string', description: 'Text to type into the element' },
          },
          required: ['element', 'ref', 'text'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_snapshot',
        description: 'Capture accessibility snapshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_take_screenshot',
        description: 'Take a screenshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'File name to save the screenshot to' },
            fullPage: { type: 'boolean', description: 'Take screenshot of full page' },
          },
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_hover',
        description: 'Hover over element on page',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference' },
          },
          required: ['element', 'ref'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_select_option',
        description: 'Select an option in a dropdown',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference' },
            values: { type: 'array', items: { type: 'string' }, description: 'Values to select' },
          },
          required: ['element', 'ref', 'values'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_resize',
        description: 'Resize the browser window',
        inputSchema: {
          type: 'object',
          properties: {
            width: { type: 'number', description: 'Width of the browser window' },
            height: { type: 'number', description: 'Height of the browser window' },
          },
          required: ['width', 'height'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_tab_new',
        description: 'Open a new tab',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to navigate to in the new tab' },
          },
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_tab_close',
        description: 'Close a tab',
        inputSchema: {
          type: 'object',
          properties: {
            index: { type: 'number', description: 'The index of the tab to close' },
          },
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_tab_list',
        description: 'List browser tabs',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_tab_select',
        description: 'Select a tab by index',
        inputSchema: {
          type: 'object',
          properties: {
            index: { type: 'number', description: 'The index of the tab to select' },
          },
          required: ['index'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_wait_for',
        description: 'Wait for text to appear or disappear or a specified time to pass',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'The text to wait for' },
            textGone: { type: 'string', description: 'The text to wait for to disappear' },
            time: { type: 'number', description: 'The time to wait in seconds' },
          },
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_evaluate',
        description: 'Evaluate JavaScript expression on page or element',
        inputSchema: {
          type: 'object',
          properties: {
            function: { type: 'string', description: 'JavaScript function to execute' },
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference' },
          },
          required: ['function'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_press_key',
        description: 'Press a key on the keyboard',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Name of the key to press' },
          },
          required: ['key'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_drag',
        description: 'Perform drag and drop between two elements',
        inputSchema: {
          type: 'object',
          properties: {
            startElement: { type: 'string', description: 'Source element description' },
            startRef: { type: 'string', description: 'Source element reference' },
            endElement: { type: 'string', description: 'Target element description' },
            endRef: { type: 'string', description: 'Target element reference' },
          },
          required: ['startElement', 'startRef', 'endElement', 'endRef'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_navigate_back',
        description: 'Go back to the previous page',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_navigate_forward',
        description: 'Go forward to the next page',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_console_messages',
        description: 'Returns all console messages',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_network_requests',
        description: 'Returns all network requests since loading the page',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_handle_dialog',
        description: 'Handle a dialog (alert, confirm, prompt)',
        inputSchema: {
          type: 'object',
          properties: {
            accept: { type: 'boolean', description: 'Whether to accept the dialog' },
            promptText: { type: 'string', description: 'Text for prompt dialog' },
          },
          required: ['accept'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_file_upload',
        description: 'Upload one or multiple files',
        inputSchema: {
          type: 'object',
          properties: {
            paths: { type: 'array', items: { type: 'string' }, description: 'File paths to upload' },
          },
          required: ['paths'],
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_close',
        description: 'Close the browser page',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      {
        name: 'playwright-browser_install',
        description: 'Install the browser specified in the config',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        serverType: 'browser',
      },
      // Additional browser tools would be listed here...
    ];
  }

  async invokeTool(toolName: string, parameters: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (toolName.startsWith('github-mcp-server-')) {
        return await this.invokeGitHubTool(toolName, parameters);
      } else if (toolName.startsWith('playwright-browser_')) {
        return await this.invokeBrowserTool(toolName, parameters);
      } else {
        throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error invoking tool ${toolName}:`, error);
      throw error;
    }
  }

  private async invokeGitHubTool(toolName: string, parameters: any): Promise<any> {
    // Mock implementation - in real implementation, this would call the GitHub MCP server
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: `Mock GitHub tool response for ${toolName} with parameters: ${JSON.stringify(parameters, null, 2)}`,
        },
      ],
    };

    return mockResponse;
  }

  private async invokeBrowserTool(toolName: string, parameters: any): Promise<any> {
    // Mock implementation - in real implementation, this would call the browser MCP server
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: `Mock browser tool response for ${toolName} with parameters: ${JSON.stringify(parameters, null, 2)}`,
        },
      ],
    };

    return mockResponse;
  }

  async listGitHubTools(): Promise<MCPTool[]> {
    return this.getGitHubTools();
  }

  async listBrowserTools(): Promise<MCPTool[]> {
    return this.getBrowserTools();
  }

  dispose(): void {
    // Cleanup resources
    this.isInitialized = false;
  }
}

export default MCPManager;