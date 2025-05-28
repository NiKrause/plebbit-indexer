import { Suspense } from 'react';
import Header from '../header';

export default function ImprintPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Imprint / Legal Notice</h1>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Information according to § 5 TMG (German Telemedia Act)</h2>
            
            <h3 className="text-lg font-medium mb-2">Service Provider:</h3>
            <p className="mb-4">
              Le Space UG (haftungsbeschränkt)<br />
              Lichtenberg 44<br />
              84307 Eggenfelden<br />
              Germany<br />
              Email: <a href="mailto:plebscan@le-space.de">plebscan@le-space.de</a><br />
              Phone: <a href="tel:+49872112896000">+49 8721 12896000</a>
            </p>

            <h3 className="text-lg font-medium mb-2">Geschäftsführer:</h3>
            <p className="mb-4">
              Nico Krause<br />
              Lichtenberg 44<br />
              84307 Eggenfelden<br />
              Germany
              Email: <a href="mailto:nico.krause@le-space.de">nico.krause@le-space.de</a><br />
              Phone: <a href="tel:+49872112896000">+49 8721 12896000</a>
            </p>

            <h3 className="text-lg font-medium mb-2">Responsible for content according to § 55 (2) RStV:</h3>
            <p className="mb-4">
              Le Space UG (haftungsbeschränkt)<br />
              Lichtenberg 44<br />
              84307 Eggenfelden<br />
              Germany<br />
              Email: <a href="mailto:plebscan@le-space.de">plebscan@le-space.de</a><br />
              Phone: <a href="tel:+49872112896000">+49 8721 12896000</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Service Description:</h2>
            <p className="mb-4">
              This service provides a search engine for content within the decentralized peer-to-peer community &quot;Plebbit&quot;, which operates on the IPFS (InterPlanetary File System) network. The service indexes publicly accessible content from independently operated subforums (so-called &quot;SubPlebbit communities&quot;) and makes it searchable.
            </p>
            <p className="mb-4">
              We do not host or operate any communities ourselves and are not responsible for the content posted within them. Each SubPlebbit community is responsible for its own content, managed by its respective users or moderators.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Liability for Content:</h2>
            <p className="mb-4">
              As a service provider, we are responsible for our own content on this search engine in accordance with general legislation (§ 7 (1) TMG). However, pursuant to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
            </p>
            <p className="mb-4">
              Once we become aware of specific legal violations, such content will be promptly removed from our index. A <strong>reporting feature</strong> is available (&quot;Report&quot; button) for notifying us of potentially illegal or questionable content. Each report is reviewed by us, and if a legal or policy violation is confirmed, the respective entry is removed from the index. The associated author or community (SubPlebbit) may also be excluded from future indexing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Liability for Links:</h2>
            <p className="mb-4">
              Our service may contain links to external websites operated by third parties, over whose content we have no control. We therefore cannot accept any liability for such third-party content. The respective provider or operator of the linked pages is always responsible for their content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Copyright:</h2>
            <p className="mb-4">
              Content and works created by us on this platform are subject to German copyright law. Third-party content is marked accordingly. Any duplication, editing, distribution, or use beyond the scope permitted by copyright law requires the prior written consent of the respective author or creator.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Dispute Resolution:</h2>
            <p className="mb-4">
              The European Commission provides a platform for online dispute resolution (ODR): <a href="https://ec.europa.eu/consumers/odr/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>
            </p>
            <p className="mb-4">
              We are neither obligated nor willing to participate in a dispute resolution procedure before a consumer arbitration board.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 