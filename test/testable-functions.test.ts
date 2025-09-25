import {
  CHAT_SESSION_TYPE,
  generateSessionId,
  generateSessionLabel,
  createSessionItem,
  getSessionContentType,
  createMockCompletedSession,
  createMockInProgressSession,
  createMockUntitledSession,
  handleConfirmationStep,
  getDefaultSessionItems
} from '../src/testable-functions';

describe('JoshBot Extension Functions', () => {
  
  describe('Constants', () => {
    test('CHAT_SESSION_TYPE should be correct', () => {
      expect(CHAT_SESSION_TYPE).toBe('josh-bot');
    });
  });

  describe('Session ID and Label Generation', () => {
    test('generateSessionId should create correct format', () => {
      expect(generateSessionId(1)).toBe('session-1');
      expect(generateSessionId(5)).toBe('session-5');
      expect(generateSessionId(100)).toBe('session-100');
    });

    test('generateSessionLabel should create correct format', () => {
      expect(generateSessionLabel(1)).toBe('JoshBot Session 1');
      expect(generateSessionLabel(5)).toBe('JoshBot Session 5');
      expect(generateSessionLabel(100)).toBe('JoshBot Session 100');
    });

    test('generateSessionId should handle edge cases', () => {
      expect(generateSessionId(0)).toBe('session-0');
      expect(generateSessionId(-1)).toBe('session--1');
    });
  });

  describe('Session Item Creation', () => {
    test('createSessionItem should create item with default status', () => {
      const item = createSessionItem('test-id', 'Test Label');
      expect(item).toEqual({
        id: 'test-id',
        label: 'Test Label',
        status: 'Completed'
      });
    });

    test('createSessionItem should create item with custom status', () => {
      const item = createSessionItem('test-id', 'Test Label', 'InProgress');
      expect(item).toEqual({
        id: 'test-id',
        label: 'Test Label',
        status: 'InProgress'
      });
    });
  });

  describe('Session Content Type Detection', () => {
    test('should identify demo completed sessions', () => {
      expect(getSessionContentType('demo-session-01')).toBe('demo-completed');
      expect(getSessionContentType('demo-session-02')).toBe('demo-completed');
    });

    test('should identify demo in-progress session', () => {
      expect(getSessionContentType('demo-session-03')).toBe('demo-in-progress');
    });

    test('should identify dynamic sessions', () => {
      expect(getSessionContentType('session-1')).toBe('dynamic');
      expect(getSessionContentType('session-42')).toBe('dynamic');
      expect(getSessionContentType('session-999')).toBe('dynamic');
    });

    test('should identify untitled sessions', () => {
      expect(getSessionContentType('random-id')).toBe('untitled');
      expect(getSessionContentType('some-other-session')).toBe('untitled');
      expect(getSessionContentType('untitled-123')).toBe('untitled');
    });
  });

  describe('Mock Session Creation', () => {
    test('createMockCompletedSession should create valid session', () => {
      const session = createMockCompletedSession('test-session');
      
      expect(session.history).toHaveLength(2);
      expect(session.history[0].type).toBe('request');
      expect(session.history[0].text).toBe('hello');
      expect(session.history[1].type).toBe('response');
      expect(session.history[1].content).toBe('Session: test-session\n');
      expect(session.requestHandler).toBeUndefined();
    });

    test('createMockInProgressSession should create valid session', () => {
      const session = createMockInProgressSession('progress-session');
      
      expect(session.history).toHaveLength(2);
      expect(session.history[0].type).toBe('request');
      expect(session.history[1].type).toBe('response');
      expect(session.history[1].content).toBe('Session: progress-session\n');
      expect(session.activeResponseCallback).toBeDefined();
      expect(typeof session.activeResponseCallback).toBe('function');
    });

    test('createMockUntitledSession should create valid session', () => {
      const session = createMockUntitledSession('untitled-session');
      
      expect(session.history).toHaveLength(2);
      expect(session.history[0].type).toBe('request');
      expect(session.history[0].text).toBe('Howdy');
      expect(session.history[1].type).toBe('response');
      expect(session.history[1].content).toHaveLength(2);
      expect(session.history[1].content[0]).toBe('Session: untitled-session\n\n');
      expect(session.history[1].content[1]).toBe('This is an untitled session. Send a message to begin our session.\n');
    });
  });

  describe('Confirmation Step Handling', () => {
    test('should handle create step acceptance', () => {
      const result = handleConfirmationStep('create', true);
      expect(result).toEqual({
        action: 'create_session',
        message: 'Creating new session...'
      });
    });

    test('should handle create step rejection', () => {
      const result = handleConfirmationStep('create', false);
      expect(result).toEqual({
        action: 'cancel_creation',
        message: 'New session was not created.'
      });
    });

    test('should handle ping step acceptance', () => {
      const result = handleConfirmationStep('ping', true);
      expect(result).toEqual({
        action: 'pong',
        message: 'pong!'
      });
    });

    test('should handle ping step rejection', () => {
      const result = handleConfirmationStep('ping', false);
      expect(result).toEqual({
        action: 'no_pong',
        message: undefined
      });
    });

    test('should handle unknown steps', () => {
      const result = handleConfirmationStep('unknown', true);
      expect(result).toEqual({
        action: 'unknown',
        message: 'Unknown confirmation step: unknown'
      });
    });
  });

  describe('Default Session Items', () => {
    test('getDefaultSessionItems should return correct demo sessions', () => {
      const items = getDefaultSessionItems();
      
      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({
        id: 'demo-session-01',
        label: 'JoshBot Demo Session 01',
        status: 'Completed'
      });
      expect(items[1]).toEqual({
        id: 'demo-session-02',
        label: 'JoshBot Demo Session 02',
        status: 'Completed'
      });
      expect(items[2]).toEqual({
        id: 'demo-session-03',
        label: 'JoshBot Demo Session 03',
        status: 'InProgress'
      });
    });

    test('default session items should be immutable', () => {
      const items1 = getDefaultSessionItems();
      const items2 = getDefaultSessionItems();
      
      // Should return different instances
      expect(items1).not.toBe(items2);
      // But with the same content
      expect(items1).toEqual(items2);
    });
  });

  describe('Integration Tests', () => {
    test('should create complete session workflow', () => {
      const sessionCount = 5;
      const sessionId = generateSessionId(sessionCount);
      const label = generateSessionLabel(sessionCount);
      const sessionItem = createSessionItem(sessionId, label, 'InProgress');
      const contentType = getSessionContentType(sessionId);
      
      expect(sessionId).toBe('session-5');
      expect(label).toBe('JoshBot Session 5');
      expect(sessionItem).toEqual({
        id: 'session-5',
        label: 'JoshBot Session 5',
        status: 'InProgress'
      });
      expect(contentType).toBe('dynamic');
    });

    test('should handle confirmation and session creation flow', () => {
      const createResult = handleConfirmationStep('create', true);
      expect(createResult.action).toBe('create_session');
      
      if (createResult.action === 'create_session') {
        const sessionId = generateSessionId(1);
        const session = createMockCompletedSession(sessionId);
        expect(session.history[1].content).toContain('session-1');
      }
    });
  });
});