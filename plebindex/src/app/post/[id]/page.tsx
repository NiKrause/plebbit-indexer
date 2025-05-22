// app/posts.tsx (partial update only)

import Header from '../../header';
import Replies from '../replies';

// Define the SearchParams type for this page
type SearchParams = {
  page?: string;
  sort?: string;
};

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  /* resolve the promise that Next passes in */
  const resolvedSearchParams = await searchParams;
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <Replies
          postId={id}
          searchParams={resolvedSearchParams}
        />
      </main>
    </div>
  );
}