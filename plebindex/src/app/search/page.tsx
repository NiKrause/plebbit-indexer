import Posts from '../posts';
import Header from '../header';

// describe exactly what can appear in the query-string
type SearchParams = {
  q?: string;     // /search?q=hello
  page?: string;  // /search?page=2
  sort?: string;  // /search?sort=top
  t?: string;     // /search?t=day (time filter)
};

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  /* resolve the promise that Next passes in */
  const resolvedSearchParams = await searchParams;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col">
        <Posts searchParams={resolvedSearchParams} />
      </main>
    </div>
  );
}
