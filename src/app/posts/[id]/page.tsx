import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getUser } from '@/lib/data'
import { PostCard } from '@/components/PostCard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = getPost(id)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const user = getUser(post.userId)
  const handle = user ? `@${user.username}` : 'Unknown'

  return { title: `${handle} - ${post.title}` }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = getPost(id)

  if (!post) {
    notFound()
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-4">
      <PostCard post={post} />
    </main>
  )
}
