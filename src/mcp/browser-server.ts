import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolRequest,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

interface BrowserToolParams {
  url?: string;
  element?: string;
  ref?: string;
  text?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

class BrowserMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'playwright-browser',
        version: '0.0.34',
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
        name: 'playwright-browser_navigate',
        description: 'Navigate to a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to navigate to' },
          },
          required: ['url'],
        },
      },
      {
        name: 'playwright-browser_click',
        description: 'Perform click on a web page',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference from the page snapshot' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Button to click, defaults to left' },
            doubleClick: { type: 'boolean', description: 'Whether to perform a double click instead of a single click' },
          },
          required: ['element', 'ref'],
        },
      },
      {
        name: 'playwright-browser_type',
        description: 'Type text into editable element',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference from the page snapshot' },
            text: { type: 'string', description: 'Text to type into the element' },
            slowly: { type: 'boolean', description: 'Whether to type one character at a time' },
            submit: { type: 'boolean', description: 'Whether to submit entered text (press Enter after)' },
          },
          required: ['element', 'ref', 'text'],
        },
      },
      {
        name: 'playwright-browser_snapshot',
        description: 'Capture accessibility snapshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'playwright-browser_take_screenshot',
        description: 'Take a screenshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference from the page snapshot' },
            filename: { type: 'string', description: 'File name to save the screenshot to' },
            fullPage: { type: 'boolean', description: 'When true, takes a screenshot of the full scrollable page' },
            type: { type: 'string', enum: ['png', 'jpeg'], default: 'png', description: 'Image format for the screenshot' },
          },
        },
      },
      {
        name: 'playwright-browser_hover',
        description: 'Hover over element on page',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference from the page snapshot' },
          },
          required: ['element', 'ref'],
        },
      },
      {
        name: 'playwright-browser_select_option',
        description: 'Select an option in a dropdown',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference from the page snapshot' },
            values: { type: 'array', items: { type: 'string' }, description: 'Array of values to select in the dropdown' },
          },
          required: ['element', 'ref', 'values'],
        },
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
      },
      {
        name: 'playwright-browser_tab_list',
        description: 'List browser tabs',
        inputSchema: {
          type: 'object',
          properties: {},
        },
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
      },
      {
        name: 'playwright-browser_evaluate',
        description: 'Evaluate JavaScript expression on page or element',
        inputSchema: {
          type: 'object',
          properties: {
            function: { type: 'string', description: '() => { /* code */ } or (element) => { /* code */ } when element is provided' },
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference from the page snapshot' },
          },
          required: ['function'],
        },
      },
      {
        name: 'playwright-browser_press_key',
        description: 'Press a key on the keyboard',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Name of the key to press or a character to generate, such as ArrowLeft or a' },
          },
          required: ['key'],
        },
      },
      // Add more browser tools here...
    ];
  }

  private async handleToolCall(request: CallToolRequest): Promise<any> {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case 'playwright-browser_navigate':
          return await this.navigate(args as BrowserToolParams);
        case 'playwright-browser_click':
          return await this.click(args as BrowserToolParams);
        case 'playwright-browser_type':
          return await this.type(args as BrowserToolParams);
        case 'playwright-browser_snapshot':
          return await this.snapshot(args as BrowserToolParams);
        case 'playwright-browser_take_screenshot':
          return await this.takeScreenshot(args as BrowserToolParams);
        case 'playwright-browser_hover':
          return await this.hover(args as BrowserToolParams);
        case 'playwright-browser_select_option':
          return await this.selectOption(args as BrowserToolParams);
        case 'playwright-browser_resize':
          return await this.resize(args as BrowserToolParams);
        case 'playwright-browser_tab_new':
          return await this.tabNew(args as BrowserToolParams);
        case 'playwright-browser_tab_close':
          return await this.tabClose(args as BrowserToolParams);
        case 'playwright-browser_tab_list':
          return await this.tabList(args as BrowserToolParams);
        case 'playwright-browser_tab_select':
          return await this.tabSelect(args as BrowserToolParams);
        case 'playwright-browser_wait_for':
          return await this.waitFor(args as BrowserToolParams);
        case 'playwright-browser_evaluate':
          return await this.evaluate(args as BrowserToolParams);
        case 'playwright-browser_press_key':
          return await this.pressKey(args as BrowserToolParams);
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

  private async navigate(params: BrowserToolParams) {
    const { url } = params;
    
    if (!url) {
      throw new Error('url is required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock browser navigation to: ${url}`,
        },
      ],
    };
  }

  private async click(params: BrowserToolParams) {
    const { element, ref, button = 'left', doubleClick = false } = params;
    
    if (!element || !ref) {
      throw new Error('element and ref are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock ${doubleClick ? 'double ' : ''}${button} click on element: ${element} (ref: ${ref})`,
        },
      ],
    };
  }

  private async type(params: BrowserToolParams) {
    const { element, ref, text, slowly = false, submit = false } = params;
    
    if (!element || !ref || !text) {
      throw new Error('element, ref, and text are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock typing "${text}" into element: ${element} (ref: ${ref})${slowly ? ' slowly' : ''}${submit ? ' with submit' : ''}`,
        },
      ],
    };
  }

  private async snapshot(params: BrowserToolParams) {
    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: 'Mock accessibility snapshot captured',
        },
      ],
    };
  }

  private async takeScreenshot(params: BrowserToolParams) {
    const { element, ref, filename, fullPage = false, type = 'png' } = params;
    
    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock screenshot taken${element ? ` of element: ${element}` : ''}${fullPage ? ' (full page)' : ''} as ${type}${filename ? ` saved to: ${filename}` : ''}`,
        },
      ],
    };
  }

  private async hover(params: BrowserToolParams) {
    const { element, ref } = params;
    
    if (!element || !ref) {
      throw new Error('element and ref are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock hover over element: ${element} (ref: ${ref})`,
        },
      ],
    };
  }

  private async selectOption(params: BrowserToolParams) {
    const { element, ref, values } = params;
    
    if (!element || !ref || !values) {
      throw new Error('element, ref, and values are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock select options "${values.join(', ')}" in element: ${element} (ref: ${ref})`,
        },
      ],
    };
  }

  private async resize(params: BrowserToolParams) {
    const { width, height } = params;
    
    if (!width || !height) {
      throw new Error('width and height are required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock browser resize to ${width}x${height}`,
        },
      ],
    };
  }

  private async tabNew(params: BrowserToolParams) {
    const { url } = params;
    
    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock new tab opened${url ? ` with URL: ${url}` : ''}`,
        },
      ],
    };
  }

  private async tabClose(params: BrowserToolParams) {
    const { index } = params;
    
    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock tab closed${index !== undefined ? ` at index: ${index}` : ' (current tab)'}`,
        },
      ],
    };
  }

  private async tabList(params: BrowserToolParams) {
    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: 'Mock tab list: [0] Tab 1 - https://example.com, [1] Tab 2 - https://github.com',
        },
      ],
    };
  }

  private async tabSelect(params: BrowserToolParams) {
    const { index } = params;
    
    if (index === undefined) {
      throw new Error('index is required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock tab selected at index: ${index}`,
        },
      ],
    };
  }

  private async waitFor(params: BrowserToolParams) {
    const { text, textGone, time } = params;
    
    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock wait for ${text ? `text: "${text}"` : textGone ? `text to disappear: "${textGone}"` : time ? `time: ${time}s` : 'unknown condition'}`,
        },
      ],
    };
  }

  private async evaluate(params: BrowserToolParams) {
    const { function: fn, element, ref } = params;
    
    if (!fn) {
      throw new Error('function is required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock JavaScript evaluation: ${fn}${element ? ` on element: ${element}` : ''}`,
        },
      ],
    };
  }

  private async pressKey(params: BrowserToolParams) {
    const { key } = params;
    
    if (!key) {
      throw new Error('key is required');
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: `Mock key press: ${key}`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Browser MCP server running on stdio');
  }
}

// Run the server if this file is executed directly
if (require.main === module) {
  const server = new BrowserMCPServer();
  server.run().catch(console.error);
}

export { BrowserMCPServer };