// Configuration pour les tests d'orchestrateur
jest.setTimeout(30000); // 30 secondes par défaut pour les tests

// Mock pour Redis - utilisé par BullMQ
jest.mock('redis', () => {
    const mockRedisClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockImplementation((key) => Promise.resolve(`mock-value-for-${key}`)),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(1),
        on: jest.fn(),
        hSet: jest.fn().mockResolvedValue(1),
        hGet: jest.fn().mockImplementation((hash, key) => Promise.resolve(`mock-value-for-${hash}-${key}`)),
        hGetAll: jest.fn().mockImplementation((hash) => Promise.resolve({ mockKey: `mock-value-for-${hash}` }))
    };

    return {
        createClient: jest.fn().mockReturnValue(mockRedisClient)
    };
});

// Mocks pour les modules externes
jest.mock('@temporalio/client', () => {
    const mockConnection = {
        workflow: {
            start: jest.fn().mockResolvedValue({ workflowId: 'mock-workflow-id' }),
            getHandle: jest.fn().mockImplementation((workflowId) => ({
                describe: jest.fn().mockResolvedValue({
                    status: { name: 'RUNNING' },
                    workflowId
                }),
                terminate: jest.fn().mockResolvedValue(undefined),
                cancel: jest.fn().mockResolvedValue(undefined),
                result: jest.fn().mockResolvedValue({ status: 'completed', data: { mockResult: true } })
            }))
        },
        close: jest.fn().mockResolvedValue(undefined)
    };

    return {
        Connection: {
            connect: jest.fn().mockResolvedValue(mockConnection)
        },
        Client: {
            create: jest.fn().mockResolvedValue(mockConnection)
        }
    };
});

// Pour le logging de débogage dans les tests si nécessaire
console.debug = jest.fn();

// Nettoyer tous les mocks après chaque test
afterEach(() => {
    jest.clearAllMocks();
});