// Simplified testable functions extracted from extension.ts
// These contain the core logic without VSCode dependencies

export const CHAT_SESSION_TYPE = 'josh-bot';

// Mock VSCode types for testing
interface MockChatSession {
  history: any[];
  requestHandler?: any;
  activeResponseCallback?: any;
}

interface MockChatSessionItem {
  id: string;
  label: string;
  status?: string;
}

// Core logic functions that can be tested
export function generateSessionId(sessionCount: number): string {
  return `session-${sessionCount}`;
}

export function generateSessionLabel(sessionCount: number): string {
  return `JoshBot Session ${sessionCount}`;
}

export function createSessionItem(sessionId: string, label: string, status = 'Completed'): MockChatSessionItem {
  return {
    id: sessionId,
    label: label,
    status: status
  };
}

export function getSessionContentType(sessionId: string): 'demo-completed' | 'demo-in-progress' | 'dynamic' | 'untitled' {
  switch (sessionId) {
    case 'demo-session-01':
    case 'demo-session-02':
      return 'demo-completed';
    case 'demo-session-03':
      return 'demo-in-progress';
    default:
      // For dynamic sessions, check if it follows the pattern
      if (sessionId.startsWith('session-')) {
        return 'dynamic';
      }
      return 'untitled';
  }
}

export function createMockCompletedSession(sessionId: string): MockChatSession {
  return {
    history: [
      { type: 'request', text: 'hello', participant: CHAT_SESSION_TYPE },
      { type: 'response', content: `Session: ${sessionId}\n`, participant: CHAT_SESSION_TYPE }
    ],
    requestHandler: undefined
  };
}

export function createMockInProgressSession(sessionId: string): MockChatSession {
  return {
    history: [
      { type: 'request', text: 'hello', participant: CHAT_SESSION_TYPE },
      { type: 'response', content: `Session: ${sessionId}\n`, participant: CHAT_SESSION_TYPE }
    ],
    activeResponseCallback: async () => {
      // Mock in-progress callback
      return Promise.resolve();
    },
    requestHandler: undefined
  };
}

export function createMockUntitledSession(sessionId: string): MockChatSession {
  return {
    history: [
      { type: 'request', text: 'Howdy', participant: CHAT_SESSION_TYPE },
      { 
        type: 'response', 
        content: [
          `Session: ${sessionId}\n\n`,
          `This is an untitled session. Send a message to begin our session.\n`
        ], 
        participant: CHAT_SESSION_TYPE 
      }
    ],
    requestHandler: undefined
  };
}

export function handleConfirmationStep(step: string, accepted: boolean): { action: string; message?: string } {
  switch (step) {
    case 'create':
      return {
        action: accepted ? 'create_session' : 'cancel_creation',
        message: accepted ? 'Creating new session...' : 'New session was not created.'
      };
    case 'ping':
      return {
        action: accepted ? 'pong' : 'no_pong',
        message: accepted ? 'pong!' : undefined
      };
    default:
      return {
        action: 'unknown',
        message: `Unknown confirmation step: ${step}`
      };
  }
}

export function getDefaultSessionItems(): MockChatSessionItem[] {
  return [
    {
      id: 'demo-session-01',
      label: 'JoshBot Demo Session 01',
      status: 'Completed'
    },
    {
      id: 'demo-session-02',
      label: 'JoshBot Demo Session 02',
      status: 'Completed'
    },
    {
      id: 'demo-session-03',
      label: 'JoshBot Demo Session 03',
      status: 'InProgress'
    }
  ];
}