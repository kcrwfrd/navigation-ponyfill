import { notFound } from "next/navigation";
import { getPost } from "@/lib/data";
import { BackButton } from "@/components/BackButton";
import { PostCard } from "@/components/PostCard";

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <PostCard post={post} />
      </main>
    </div>
  );
}
