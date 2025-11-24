import Link from "next/link";
import { Post, getUser } from "@/lib/data";
import { UserAvatar } from "./UserAvatar";
import { PostSkeleton } from "./PostSkeleton";

export function PostCard({ post }: { post: Post }) {
  const user = getUser(post.userId);

  if (!user) return null;

  return (
    <article className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/users/${user.id}`}>
          <UserAvatar initials={user.avatar} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/users/${user.id}`}
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            {user.name}
          </Link>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            @{user.username}
          </p>
        </div>
      </div>

      <Link href={`/posts/${post.id}`} className="block group">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors mb-3">
          {post.title}
        </h2>
        <PostSkeleton lines={3} />
      </Link>

      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <time className="text-xs text-zinc-500 dark:text-zinc-400">
          {post.createdAt}
        </time>
      </div>
    </article>
  );
}
