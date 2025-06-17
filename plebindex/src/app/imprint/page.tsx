import { Suspense } from 'react';
import Header from '../header';

export default function ImprintPage() {
  return (
    <div className="imprint-page flex flex-col min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <Header pathname="/imprint" />
      </Suspense>
      <main className="flex-grow flex justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-4 sm:p-8 md:p-12">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Imprint / Legal Notice</h1>
          </div>
          <div className="space-y-8">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Information according to § 5 TMG</h2>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
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

                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Service Description</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  This service provides an independent search engine for content in the <a href="https://plebbit.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">Plebbit</a> community, which operates on the IPFS (InterPlanetary File System) network. The service indexes publicly accessible content from independently operated subforums (so-called &quot;SubPlebbit communities&quot;) and makes it searchable.
                </p>
                <p>
                  We do not host or operate any communities ourselves and are not responsible for the content posted within them. Each SubPlebbit community is responsible for its own content, managed by its respective users or moderators.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Liability for Content</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  As a service provider, we are responsible for our own content on this search engine in accordance with general legislation (§ 7 (1) TMG). However, pursuant to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
                </p>
                <p>
                Once we become aware of specific legal violations, such content will be promptly removed from our index. A reporting feature is available ("Report" button) for notifying us of potentially illegal or questionable content. Each report is reviewed by us, and if a legal or policy violation is confirmed, the respective entry is removed from our index. Please note that as an independent search engine, we can only remove content from our index - we have no control over or access to the actual SubPlebbit nodes that host the content. The associated author or community (SubPlebbit) may also be excluded from future indexing in our search engine
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Liability for Links</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our service may contain links to external websites operated by third parties, over whose content we have no control. We therefore cannot accept any liability for such third-party content. The respective provider or operator of the linked pages is always responsible for their content.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Copyright</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Content and works created by us on this platform are subject to German copyright law. Third-party content is marked accordingly. Any duplication, editing, distribution, or use beyond the scope permitted by copyright law requires the prior written consent of the respective author or creator.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Dispute Resolution</h2>
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Data Protection (GDPR)</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In accordance with the General Data Protection Regulation (GDPR), we provide the following information about data processing:
                </p>
                
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
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
                  <ul className="list-disc pl-8 space-y-1">
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Privacy and Data Usage</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our service is designed with privacy in mind:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Search preferences are stored locally in your browser&apos;s localStorage</li>
                  <li>No user accounts or session cookies are required</li>
                  <li>
                    <strong>Google Analytics:</strong> We use Google Analytics to understand how our service is used and to improve user experience. The implementation varies based on your location:
                    <ul className="list-disc pl-6 mt-2">
                      <li><strong>For Users in Jurisdictions Requiring Consent:</strong> Google Analytics is disabled by default and requires explicit consent through our cookie consent banner. You can enable or disable it through this banner. This applies to users in:
                        <ul className="list-disc pl-6 mt-2">
                          <li>European Union (EU) countries</li>
                          <li>United Kingdom</li>
                          <li>Brazil</li>
                          <li>California, USA</li>
                          <li>South Korea</li>
                          <li>Japan</li>
                          <li>Canada</li>
                          <li>Australia</li>
                          <li>South Africa</li>
                          <li>India</li>
                        </ul>
                      </li>
                      <li><strong>For Other Users:</strong> Google Analytics is enabled by default to help us understand and improve our service. No cookie consent banner is shown, and analytics are automatically enabled.</li>
                    </ul>
                    Google Analytics collects anonymous data about:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Pages visited and time spent on each page</li>
                      <li>Browser type and device information</li>
                      <li>Geographic location (country/region level)</li>
                      <li>How you found our service (referral sources)</li>
                    </ul>
                    This data helps us improve our service and understand user needs. The data is anonymous and cannot be used to identify individual users.
                  </li>
                  <li>IP addresses are temporarily stored in standard access logs for security purposes only</li>
                </ul>

                <div className="mt-6 bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Cookie Consent and Privacy Compliance</h3>
                  <p>
                    Our cookie consent implementation varies based on your location:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>Users in Jurisdictions Requiring Consent:</strong> You will see a cookie consent banner that requires explicit consent before any tracking cookies are set. Google Analytics is disabled by default until you provide consent.</li>
                    <li><strong>Other Users:</strong> Google Analytics is enabled by default without showing a cookie consent banner. This is in compliance with privacy regulations applicable to your jurisdiction.</li>
                  </ul>
                  <p className="mt-2">
                    This implementation ensures compliance with various privacy regulations including the EU&apos;s General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), Brazil&apos;s LGPD, and other applicable privacy laws. For users in jurisdictions requiring consent, your cookie preferences are stored in your browser&apos;s localStorage and will be respected across all pages of our service.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">API Usage</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our search API is currently available for free use. We reserve the right to modify this policy in the future, with appropriate notice to users.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 border-b border-gray-200 pb-4 mb-6">Content Moderation</h2>
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