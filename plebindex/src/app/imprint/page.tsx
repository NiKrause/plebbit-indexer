import { Suspense } from 'react';
import Header from '../header';

export default function ImprintPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      <main className="flex-grow flex justify-center py-10 px-2">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 md:p-12 space-y-12">
          <h1 className="text-3xl font-extrabold text-gray-900">Imprint / Legal Notice</h1>

          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Information according to § 5 TMG (German Telemedia Act)</h2>
            <div>
              <h3 className="font-semibold text-gray-700">Service Provider:</h3>
              <div className="ml-4 text-gray-700 space-y-1">
                <div>Le Space UG (haftungsbeschränkt)</div>
                <div>Lichtenberg 44</div>
                <div>84307 Eggenfelden</div>
                <div>Germany</div>
                <div>
                  Email: <a href="mailto:plebscan@le-space.de" className="text-blue-600 hover:underline">plebscan@le-space.de</a>
                </div>
                <div>
                  Phone: <a href="tel:+49872112896000" className="text-blue-600 hover:underline">+49 8721 12896000</a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Geschäftsführer:</h3>
              <div className="ml-4 text-gray-700 space-y-1">
                <div>Nico Krause</div>
                <div>Lichtenberg 44</div>
                <div>84307 Eggenfelden</div>
                <div>Germany</div>
                <div>
                  Email: <a href="mailto:nico.krause@le-space.de" className="text-blue-600 hover:underline">nico.krause@le-space.de</a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Responsible for content according to § 55 (2) RStV:</h3>
              <div className="ml-4 text-gray-700 space-y-1">
                <div>Le Space UG (haftungsbeschränkt)</div>
                <div>Lichtenberg 44</div>
                <div>84307 Eggenfelden</div>
                <div>Germany</div>
                <div>
                  Email: <a href="mailto:plebscan@le-space.de" className="text-blue-600 hover:underline">plebscan@le-space.de</a>
                </div>
                <div>
                  Phone: <a href="tel:+49872112896000" className="text-blue-600 hover:underline">+49 8721 12896000</a>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Service Description:</h2>
            <p className="text-gray-700">
              This service provides a search engine for content within the decentralized peer-to-peer community &quot;Plebbit&quot;, which operates on the IPFS (InterPlanetary File System) network. The service indexes publicly accessible content from independently operated subforums (so-called &quot;SubPlebbit communities&quot;) and makes it searchable.
            </p>
            <p className="text-gray-700">
              We do not host or operate any communities ourselves and are not responsible for the content posted within them. Each SubPlebbit community is responsible for its own content, managed by its respective users or moderators.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Liability for Content:</h2>
            <p className="text-gray-700">
              As a service provider, we are responsible for our own content on this search engine in accordance with general legislation (§ 7 (1) TMG). However, pursuant to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
            </p>
            <p className="text-gray-700">
              Once we become aware of specific legal violations, such content will be promptly removed from our index. A <strong>reporting feature</strong> is available (&quot;Report&quot; button) for notifying us of potentially illegal or questionable content. Each report is reviewed by us, and if a legal or policy violation is confirmed, the respective entry is removed from the index. The associated author or community (SubPlebbit) may also be excluded from future indexing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Liability for Links:</h2>
            <p className="text-gray-700">
              Our service may contain links to external websites operated by third parties, over whose content we have no control. We therefore cannot accept any liability for such third-party content. The respective provider or operator of the linked pages is always responsible for their content.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Copyright:</h2>
            <p className="text-gray-700">
              Content and works created by us on this platform are subject to German copyright law. Third-party content is marked accordingly. Any duplication, editing, distribution, or use beyond the scope permitted by copyright law requires the prior written consent of the respective author or creator.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Dispute Resolution:</h2>
            <p className="text-gray-700">
              The European Commission provides a platform for online dispute resolution (ODR):{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-gray-700">
              We are neither obligated nor willing to participate in a dispute resolution procedure before a consumer arbitration board.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 