import { notFound } from 'next/navigation'
import { getPost } from '@/lib/data'
import { PostCard } from '@/components/PostCard'

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
