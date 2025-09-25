import { CHAT_SESSION_TYPE } from '../src/testable-functions';

// Additional simple tests for constants and basic patterns used in the extension
describe('JoshBot Extension Constants and Patterns', () => {
  
  describe('Chat Session Type', () => {
    test('should match expected pattern', () => {
      expect(CHAT_SESSION_TYPE).toMatch(/^[a-z-]+$/);
      expect(CHAT_SESSION_TYPE).not.toContain(' ');
      expect(CHAT_SESSION_TYPE).toBe('josh-bot');
    });
  });

  describe('Session ID Patterns', () => {
    test('demo session IDs should follow pattern', () => {
      const demoIds = ['demo-session-01', 'demo-session-02', 'demo-session-03'];
      
      demoIds.forEach(id => {
        expect(id).toMatch(/^demo-session-\d{2}$/);
      });
    });

    test('dynamic session IDs should follow pattern', () => {
      const dynamicIds = ['session-1', 'session-42', 'session-999'];
      
      dynamicIds.forEach(id => {
        expect(id).toMatch(/^session-\d+$/);
      });
    });
  });

  describe('Message Patterns', () => {
    test('should handle standard greeting messages', () => {
      const greetings = ['hello', 'Howdy', 'hi'];
      
      greetings.forEach(greeting => {
        expect(typeof greeting).toBe('string');
        expect(greeting.length).toBeGreaterThan(0);
      });
    });

    test('session content should include session ID', () => {
      const sessionId = 'test-session-123';
      const content = `Session: ${sessionId}\n`;
      
      expect(content).toContain(sessionId);
      expect(content).toMatch(/^Session: .+\n$/);
    });
  });

  describe('Status Values', () => {
    test('should recognize valid session statuses', () => {
      const validStatuses = ['Completed', 'InProgress', 'Failed'];
      
      validStatuses.forEach(status => {
        expect(['Completed', 'InProgress', 'Failed']).toContain(status);
      });
    });
  });

  describe('Simple Utility Functions', () => {
    test('should format messages consistently', () => {
      const formatMessage = (msg: string) => `${msg}\n\n`;
      
      expect(formatMessage('Test')).toBe('Test\n\n');
      expect(formatMessage('Hello World')).toBe('Hello World\n\n');
    });

    test('should check if string is empty or whitespace', () => {
      const isEmpty = (str: string) => !str || str.trim().length === 0;
      
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' hello ')).toBe(false);
    });

    test('should extract number from session ID', () => {
      const extractNumber = (sessionId: string) => {
        const match = sessionId.match(/^session-(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      };

      expect(extractNumber('session-1')).toBe(1);
      expect(extractNumber('session-42')).toBe(42);
      expect(extractNumber('demo-session-01')).toBeNull();
      expect(extractNumber('invalid')).toBeNull();
    });
  });
});