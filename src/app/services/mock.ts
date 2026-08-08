import { User } from '../types/user'; // Adjust the import path
import { Board, TaskColumn } from '../types/board'; // Adjust the import path

const mockUsers: Record<string, User> = {
  pedro: { name: 'pedro', boards: [] },
  ana: { name: 'ana', boards: [] },
  luis: { name: 'luis', boards: [] },
};

export const mockUser: User = {
  name: 'pedro',
  boards: [
    {
      id: 'board-001',
      title: '🚀 Product Launch 2026',
      description: 'Main planning board for Q1 roadmap execution.',
      previewUrl: 'https://picsum.photos/200',
    },
    {
      id: 'board-002',
      title: '🏠 Home Renovation',
      description: 'Tracking contractor tasks and design ideas.',
      previewUrl: 'https://picsum.photos/200',
    },
  ],
};

export const mockBoards: Array<Board> = [
  {
    id: 'board-001',
    title: '🚀 Product Launch 2026',
    description: 'Main planning board for Q1 roadmap execution.',
    previewUrl: 'https://picsum.photos/200',
    columns: [
      {
        id: '0',
        index: 0,
        name: 'Todo',
        tasks: [
          {
            id: '1',
            title: 'Design landing page mockup',
            description: 'Create high-fidelity Figma designs for desktop and mobile.',
            createdBy: mockUsers['pedro'],
            createdAt: new Date('2026-01-05'),
            assignedTo: mockUsers['ana'],
            comments: [],
          },
          {
            id: '4',
            title: 'Write end-to-end tests',
            description: 'Configure Playwright to test critical user paths.',
            createdBy: mockUsers['pedro'],
            createdAt: new Date('2026-01-06'),
            assignedTo: mockUsers['luis'],
            comments: [],
          },
        ],
      },
      {
        id: '1',
        index: 1,
        name: 'In progress',
        tasks: [
          {
            id: '2',
            title: 'Implement authentication',
            description: 'Set up Auth0 login flow and route guards.',
            createdBy: mockUsers['ana'],
            createdAt: new Date('2026-01-07'),
            assignedTo: mockUsers['pedro'],
            comments: [],
          },
        ],
      },
      {
        id: '2',
        index: 2,
        name: 'Review',
        tasks: [
          {
            id: '3',
            title: 'Write API documentation',
            description: 'Document endpoints for user and board resources.',
            createdBy: mockUsers['luis'],
            createdAt: new Date('2026-01-08'),
            assignedTo: mockUsers['ana'],
            comments: [],
          },
        ],
      },
      {
        id: '3',
        index: 3,
        name: 'Done',
        tasks: [],
      },
    ] satisfies Array<TaskColumn>,
  },
  {
    id: 'board-002',
    title: '🏠 Home Renovation',
    description: 'Tracking contractor tasks and design ideas.',
    previewUrl: 'https://picsum.photos/200',
    columns: [
      {
        id: '0',
        index: 0,
        name: 'Todo',
        tasks: [
          {
            id: '1',
            title: 'Pick kitchen tile colors',
            description: 'Review ceramic samples from the supplier.',
            createdBy: mockUsers['ana'],
            createdAt: new Date('2026-01-05'),
            assignedTo: mockUsers['pedro'],
            comments: [],
          },
        ],
      },
      {
        id: '1',
        index: 1,
        name: 'In progress',
        tasks: [],
      },
      {
        id: '2',
        index: 2,
        name: 'Review',
        tasks: [
          {
            id: '2',
            title: 'Approve plumbing quote',
            description: 'Review final budget proposal with contractor.',
            createdBy: mockUsers['luis'],
            createdAt: new Date('2026-01-06'),
            assignedTo: mockUsers['ana'],
            comments: [],
          },
        ],
      },
      {
        id: '3',
        index: 3,
        name: 'Done',
        tasks: [],
      },
    ] satisfies Array<TaskColumn>,
  },
];
