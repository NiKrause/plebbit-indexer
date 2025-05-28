import { Suspense } from 'react';
import Header from '../header';

export default function ImprintPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      <main className="flex-grow flex justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 md:p-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Imprint / Legal Notice</h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="space-y-16">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Information according to § 5 TMG</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Provider</h3>
                  <div className="space-y-2 text-gray-700">
                    <div>Le Space UG (haftungsbeschränkt)</div>
                    <div>Lichtenberg 44</div>
                    <div>84307 Eggenfelden</div>
                    <div>Germany</div>
                    <div>
                      Email: <a href="mailto:plebscan@le-space.de" className="text-blue-600 hover:text-blue-800 transition-colors">plebscan@le-space.de</a>
                    </div>
                    <div>
                      Phone: <a href="tel:+49872112896000" className="text-blue-600 hover:text-blue-800 transition-colors">+49 8721 12896000</a>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Geschäftsführer</h3>
                  <div className="space-y-2 text-gray-700">
                    <div>Nico Krause</div>
                    <div>Lichtenberg 44</div>
                    <div>84307 Eggenfelden</div>
                    <div>Germany</div>
                    <div>
                      Email: <a href="mailto:nico.krause@le-space.de" className="text-blue-600 hover:text-blue-800 transition-colors">nico.krause@le-space.de</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Service Description</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  This service provides a search engine for content within the decentralized peer-to-peer community &quot;Plebbit&quot;, which operates on the IPFS (InterPlanetary File System) network. The service indexes publicly accessible content from independently operated subforums (so-called &quot;SubPlebbit communities&quot;) and makes it searchable.
                </p>
                <p>
                  We do not host or operate any communities ourselves and are not responsible for the content posted within them. Each SubPlebbit community is responsible for its own content, managed by its respective users or moderators.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Liability for Content</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  As a service provider, we are responsible for our own content on this search engine in accordance with general legislation (§ 7 (1) TMG). However, pursuant to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
                </p>
                <p>
                  Once we become aware of specific legal violations, such content will be promptly removed from our index. A <strong>reporting feature</strong> is available (&quot;Report&quot; button) for notifying us of potentially illegal or questionable content. Each report is reviewed by us, and if a legal or policy violation is confirmed, the respective entry is removed from the index. The associated author or community (SubPlebbit) may also be excluded from future indexing.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Liability for Links</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our service may contain links to external websites operated by third parties, over whose content we have no control. We therefore cannot accept any liability for such third-party content. The respective provider or operator of the linked pages is always responsible for their content.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Copyright</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Content and works created by us on this platform are subject to German copyright law. Third-party content is marked accordingly. Any duplication, editing, distribution, or use beyond the scope permitted by copyright law requires the prior written consent of the respective author or creator.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Dispute Resolution</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  The European Commission provides a platform for online dispute resolution (ODR):{' '}
                  <a
                    href="https://ec.europa.eu/consumers/odr/"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p>
                  We are neither obligated nor willing to participate in a dispute resolution procedure before a consumer arbitration board.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 