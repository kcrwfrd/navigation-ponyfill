import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUser, getUserPosts } from '@/lib/data'
import { UserAvatar } from '@/components/UserAvatar'
import { PostCard } from '@/components/PostCard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = getUser(id)

  if (!user) {
    return { title: 'User Not Found' }
  }

  return { title: `@${user.username}` }
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = getUser(id)

  if (!user) {
    notFound()
  }

  const userPosts = getUserPosts(id)

  return (
    <main className="max-w-lg mx-auto px-4 py-4">
      <nav className="flex gap-3 mb-4 text-sm">
        <a
          href="#profile"
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Profile
        </a>
        <a
          href="#posts"
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Posts
        </a>
        <a
          href="#stats"
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Stats
        </a>
      </nav>

      <div
        id="profile"
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6"
      >
        <div className="flex items-center gap-4">
          <UserAvatar initials={user.avatar} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {user.name}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">@{user.username}</p>
          </div>
        </div>
      </div>

      <h2
        id="posts"
        className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4"
      >
        Posts
      </h2>

      <div className="space-y-4">
        {userPosts.length > 0 ? (
          userPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
            No posts yet
          </p>
        )}
      </div>
    </main>
  )
}
