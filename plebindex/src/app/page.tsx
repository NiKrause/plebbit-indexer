import Posts from './posts';
import Header from './header';

export default function Home({ 
  searchParams 
}: { 
  searchParams?: { q?: string } 
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col items-center">
        <Posts searchParams={searchParams} />
      </main>
    </div>
  );
}
