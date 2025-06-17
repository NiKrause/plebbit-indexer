import { redirect } from 'next/navigation';
import Posts from './posts';
import Header from './header';

// describe exactly what can appear in the query-string
type SearchParams = {
  q?: string;     // /?q=hello
  page?: string;  // /?page=2   (example of another parameter you might add)
  sort?: string;  // /?sort=top
  t?: string;     // /?t=day (time filter)
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  /* resolve the promise that Next passes in */
  const resolvedSearchParams = await searchParams;

  // If there's a search query, redirect to the search page with the same parameters
  if (resolvedSearchParams.q) {
    const params = new URLSearchParams();
    if (resolvedSearchParams.q) params.set('q', resolvedSearchParams.q);
    if (resolvedSearchParams.page) params.set('page', resolvedSearchParams.page);
    if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
    if (resolvedSearchParams.t) params.set('t', resolvedSearchParams.t);
    
    const searchUrl = `/search?${params.toString()}`;
    redirect(searchUrl);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header pathname="/" />
      
      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col">
        <Posts searchParams={resolvedSearchParams} />
      </main>
    </div>
  );
}
