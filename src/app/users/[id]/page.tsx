import { notFound } from "next/navigation";
import { getUser, getUserPosts } from "@/lib/data";
import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/UserAvatar";
import { PostCard } from "@/components/PostCard";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = getUser(id);

  if (!user) {
    notFound();
  }

  const userPosts = getUserPosts(id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar initials={user.avatar} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {user.name}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                @{user.username}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
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
    </div>
  );
}
