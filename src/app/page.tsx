import { posts } from "@/lib/data";
import { PostCard } from "@/components/PostCard";

export default function Home() {
  return (
    <main className="max-w-lg mx-auto px-4 py-4">
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
