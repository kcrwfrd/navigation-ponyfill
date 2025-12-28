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
  {
    id: '1',
    userId: '1',
    title: 'Getting Started with React Server Components',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    userId: '2',
    title: 'The Future of Web Development',
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    userId: '1',
    title: 'Understanding the App Router',
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    userId: '3',
    title: 'Building Accessible User Interfaces',
    createdAt: '2024-01-12',
  },
  {
    id: '5',
    userId: '2',
    title: 'Performance Optimization Tips',
    createdAt: '2024-01-11',
  },
  {
    id: '6',
    userId: '3',
    title: 'Modern CSS Techniques',
    createdAt: '2024-01-10',
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
