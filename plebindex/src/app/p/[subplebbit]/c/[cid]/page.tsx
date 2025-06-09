import Header from '../../../../header';
import Replies from './replies';
import { fetchPost } from '../../../../../api/posts';
import type { Metadata } from 'next';
import { truncateText } from '../../../../../utils/formatting';

// Define the SearchParams type for this page
type SearchParams = {
  page?: string;
  sort?: string;
};


// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ subplebbit: string; cid: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await fetchPost(resolvedParams.cid);
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }

  // Use title if available, otherwise use first 60 chars of content
  const title = post.title || truncateText(post.content, 60) || 'Untitled Post';
  const description = truncateText(post.content, 160) || 'No content available';

  // Create canonical URL
  const canonicalUrl = `https://plebindex.com/p/${resolvedParams.subplebbit}/c/${resolvedParams.cid}`;

  return {
    title: `${title} - p/${post.subplebbitAddress}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Fetch post data once and pass it to both metadata and content
async function getPostData(cid: string) {
  const post = await fetchPost(cid);
  return post;
}

type Props = {
  params: Promise<{ subplebbit: string; cid: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function PostPage({ params, searchParams }: Props) {
  const { cid } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Fetch post data once
  const post = await getPostData(cid);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <Replies
          postId={cid}
          post={post}
          searchParams={resolvedSearchParams}
        />
      </main>
    </div>
  );
} 