export interface User {
  id: string
  name: string
  username: string
  avatar: string
}

export interface Post {
  id: string
  userId: string
  title: string
  createdAt: string
}

export const users: User[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    username: 'alexthompson',
    avatar: 'AT',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    username: 'sarahchen',
    avatar: 'SC',
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    username: 'marcusj',
    avatar: 'MJ',
  },
]

export const posts: Post[] = [
  // Alex Thompson (userId: 1) - React/Web Dev posts
  {
    id: '1',
    userId: '1',
    title: 'Getting Started with React Server Components',
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    userId: '1',
    title: 'Understanding the App Router',
    createdAt: '2024-01-13',
  },
  {
    id: '7',
    userId: '1',
    title: 'React 19: What You Need to Know',
    createdAt: '2024-01-08',
  },
  {
    id: '8',
    userId: '1',
    title: 'State Management in 2024',
    createdAt: '2024-01-05',
  },
  {
    id: '9',
    userId: '1',
    title: 'Building a Design System from Scratch',
    createdAt: '2024-01-02',
  },
  {
    id: '10',
    userId: '1',
    title: 'TypeScript Tips for React Developers',
    createdAt: '2023-12-28',
  },
  {
    id: '11',
    userId: '1',
    title: 'Testing React Components the Right Way',
    createdAt: '2023-12-22',
  },

  // Sarah Chen (userId: 2) - Future tech/optimization posts
  {
    id: '2',
    userId: '2',
    title: 'The Future of Web Development',
    createdAt: '2024-01-14',
  },
  {
    id: '5',
    userId: '2',
    title: 'Performance Optimization Tips',
    createdAt: '2024-01-11',
  },
  {
    id: '12',
    userId: '2',
    title: 'Edge Computing and the Modern Web',
    createdAt: '2024-01-06',
  },
  {
    id: '13',
    userId: '2',
    title: 'WebAssembly: Beyond the Hype',
    createdAt: '2024-01-03',
  },
  {
    id: '14',
    userId: '2',
    title: 'Optimizing Core Web Vitals',
    createdAt: '2023-12-30',
  },
  {
    id: '15',
    userId: '2',
    title: 'AI-Assisted Development Workflows',
    createdAt: '2023-12-25',
  },

  // Marcus Johnson (userId: 3) - Accessibility/CSS posts
  {
    id: '4',
    userId: '3',
    title: 'Building Accessible User Interfaces',
    createdAt: '2024-01-12',
  },
  {
    id: '6',
    userId: '3',
    title: 'Modern CSS Techniques',
    createdAt: '2024-01-10',
  },
  {
    id: '16',
    userId: '3',
    title: 'CSS Container Queries in Practice',
    createdAt: '2024-01-07',
  },
  {
    id: '17',
    userId: '3',
    title: 'ARIA Patterns for Complex Widgets',
    createdAt: '2024-01-04',
  },
  {
    id: '18',
    userId: '3',
    title: 'The :has() Selector Changes Everything',
    createdAt: '2024-01-01',
  },
  {
    id: '19',
    userId: '3',
    title: 'Screen Reader Testing Best Practices',
    createdAt: '2023-12-27',
  },
]

export function getUser(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getPost(id: string): Post | undefined {
  return posts.find((p) => p.id === id)
}

export function getUserPosts(userId: string): Post[] {
  return posts.filter((p) => p.userId === userId)
}
