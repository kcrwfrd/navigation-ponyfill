import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getUser } from "@/lib/data";
import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/UserAvatar";
import { PostSkeleton } from "@/components/PostSkeleton";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPost(id);

  if (!post) {
    notFound();
  }

  const user = getUser(post.userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <article className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/users/${user.id}`}>
              <UserAvatar initials={user.avatar} />
            </Link>
            <div>
              <Link
                href={`/users/${user.id}`}
                className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
              >
                {user.name}
              </Link>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                @{user.username}
              </p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            {post.title}
          </h1>

          <div className="mb-4">
            <PostSkeleton lines={6} />
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <time className="text-sm text-zinc-500 dark:text-zinc-400">
              {post.createdAt}
            </time>
          </div>
        </article>
      </main>
    </div>
  );
}
