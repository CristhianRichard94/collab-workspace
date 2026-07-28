import { User } from '../types/user'; // Adjust the import path
import { Board, TaskState } from '../types/board'; // Adjust the import path

export const mockUser: User = {
  name: 'pepito',
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
    cards: [
      {
        title: 'Design landing page mockup',
        description: 'Create high-fidelity Figma designs for desktop and mobile.',
        state: TaskState.Done,
      },
      {
        title: 'Implement authentication',
        description: 'Set up Auth0 login flow and route guards.',
        state: TaskState.InProgress,
      },
      {
        title: 'Write API documentation',
        description: 'Document endpoints for user and board resources.',
        state: TaskState.Review,
      },
      {
        title: 'Write end-to-end tests',
        description: 'Configure Playwright to test critical user paths.',
        state: TaskState.Todo,
      },
    ],
  },
  {
    id: 'board-002',
    title: '🏠 Home Renovation',
    description: 'Tracking contractor tasks and design ideas.',
    previewUrl: 'https://picsum.photos/200',
    cards: [
      {
        title: 'Pick kitchen tile colors',
        description: 'Review ceramic samples from the supplier.',
        state: TaskState.Todo,
      },
      {
        title: 'Approve plumbing quote',
        description: 'Review final budget proposal with contractor.',
        state: TaskState.Review,
      },
    ],
  },
];
