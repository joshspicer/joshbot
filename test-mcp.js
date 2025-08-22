// Simple test to verify MCP functionality
const { MCPManager } = require('./out/mcp/mcp-manager');

async function testMCPFunctionality() {
  console.log('Testing MCP functionality...');
  
  try {
    const mcpManager = MCPManager.getInstance();
    await mcpManager.initialize();
    
    console.log('✓ MCP Manager initialized successfully');
    
    const tools = await mcpManager.getAvailableTools();
    console.log(`✓ Found ${tools.length} tools`);
    
    const githubTools = tools.filter(t => t.serverType === 'github');
    const browserTools = tools.filter(t => t.serverType === 'browser');
    
    console.log(`  - GitHub tools: ${githubTools.length}`);
    console.log(`  - Browser tools: ${browserTools.length}`);
    
    // Test a GitHub tool call
    const githubResult = await mcpManager.invokeTool('github-mcp-server-get_file_contents', {
      owner: 'test',
      repo: 'test-repo',
      path: '/README.md'
    });
    console.log('✓ GitHub tool call succeeded');
    
    // Test a browser tool call
    const browserResult = await mcpManager.invokeTool('playwright-browser_navigate', {
      url: 'https://example.com'
    });
    console.log('✓ Browser tool call succeeded');
    
    console.log('\n🎉 All MCP tests passed!');
    
  } catch (error) {
    console.error('❌ MCP test failed:', error);
    process.exit(1);
  }
}

testMCPFunctionality();