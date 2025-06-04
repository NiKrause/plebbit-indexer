import { Suspense } from 'react';
import Header from '../header';

export default function ImprintPage() {
  return (
    <div className="imprint-page flex flex-col min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      <main className="flex-grow flex justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 md:p-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Imprint / Legal Notice</h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="!px-10 !py-10 !mx-10 !my-10">
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

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Data Protection (GDPR)</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In accordance with the General Data Protection Regulation (GDPR), we provide the following information about data processing:
                </p>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Controller</h3>
                  <div className="space-y-2">
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

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Processing</h3>
                  <p className="mb-2">
                    We process only a minimal amount of data, strictly necessary for the operation and security of our service:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <strong>IP addresses:</strong> Temporarily stored in access logs for security purposes only, and automatically deleted after a short period.
                    </li>
                    <li>
                      <strong>Search preferences:</strong> Stored locally in your browser&apos;s localStorage, not on our servers.
                    </li>
                    <li>
                      <strong>Content you report for moderation:</strong> No user identification is attached.
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Rights</h3>
                  <p className="mb-2">
                    Under the GDPR, you have certain rights regarding your personal data. However, since we do not collect any user identification data (no accounts, no email addresses, no tracking), it is not possible to exercise most GDPR rights as we cannot identify which data belongs to which user. This applies to both reported content and IP addresses stored in access logs.
                  </p>
                  <p>
                    <strong>Right to object to processing of your reports:</strong> Please note that, in practice, this right cannot be exercised as we cannot identify your data.
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Storage and Security</h3>
                  <p>
                    We implement appropriate technical and organizational measures to protect your data. Our data processing is based on:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Legitimate interest in providing and improving our service</li>
                    <li>Legal obligations (e.g., maintaining access logs for security)</li>
                    <li>Your consent (where applicable)</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact for Data Protection</h3>
                  <p>
                    For any questions regarding data protection or to exercise your rights, please contact:
                  </p>
                  <div className="mt-2">
                    <div>Nico Krause</div>
                    <div>Le Space UG (haftungsbeschränkt)</div>
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
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Privacy and Data Usage</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our service is designed with privacy in mind:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We do not use cookies for tracking or user identification</li>
                  <li>Search preferences are stored locally in your browser&apos;s localStorage</li>
                  <li>No user accounts or session cookies are required</li>
                  <li>We use Google Analytics to understand how our service is used and to improve user experience. Google Analytics may collect information such as your IP address, browser type, and pages visited. You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a></li>
                  <li>IP addresses are temporarily stored in standard access logs for security purposes only</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">API Usage</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our search API is currently available for free use. We reserve the right to modify this policy in the future, with appropriate notice to users.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-8">Content Moderation</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We employ a dual approach to content moderation:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>User Reporting:</strong> A reporting feature is available for users to flag potentially problematic content. Each report is reviewed by our team.
                  </li>
                  <li>
                    <strong>AI Moderation:</strong> We use AI technology to automatically scan content for:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Hate speech and discriminatory content</li>
                      <li>Violent or harmful content</li>
                      <li>Copyright violations</li>
                      <li>Other forms of malicious content</li>
                    </ul>
                  </li>
                </ul>
                <p>
                  When content is flagged, either through user reports or AI detection, it undergoes review. If violations are confirmed, the content may be removed from our index, and in some cases, the associated author or community may be excluded from future indexing.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 