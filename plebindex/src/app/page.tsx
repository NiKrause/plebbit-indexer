import Posts from './posts';
import Header from './header';

// describe exactly what can appear in the query-string
type SearchParams = {
  q?: string;     // /?q=hello
  page?: string;  // /?page=2   (example of another parameter you might add)
};

export default async function Home({
  searchParams,
}: {
  /* Next's PageProps says this is Promise<any>; give it a safer shape */
  searchParams: Promise<SearchParams>;
}) {
  /* resolve the promise that Next passes in */
  const resolvedSearchParams = await searchParams;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col items-center">
        <Posts searchParams={resolvedSearchParams} />
      </main>
    </div>
  );
}
