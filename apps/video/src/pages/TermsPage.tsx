import { Link } from 'react-router-dom';
import { InformationPage } from '../components/InformationPage';
import { projectLinks } from '../lib/projectLinks';

export function TermsPage() {
  return (
    <InformationPage title="Terms">
      <p className="lede">Using this open-source preview.</p>
      <p className="meta">Last updated: November 24, 2026.</p>
      <section>
        <h2>A browser-based prototype</h2>
        <p>
          Skeuo Video currently provides a demonstration catalog and a personal
          video library in your browser. There is no public video hosting,
          server account, cross-device sync or backup service. Profiles and
          social actions are local simulations. Features and browser support
          may change while the project is developed.
        </p>
      </section>
      <section>
        <h2>Your files and rights</h2>
        <p>
          Import only files you have the right to use. You retain your rights
          to your own media; importing it does not publish it or license it to
          Skeuo or other visitors. The project’s software license does not apply
          to your imported videos. You are responsible for keeping original
          copies. Browser storage may be cleared, and some formats may not play.
          See <Link to="/privacy">Privacy</Link> for how local data is handled.
        </p>
      </section>
      <section>
        <h2>Software license and notices</h2>
        <p>
          Copyright © 2026 Skeuo contributors. The software is provided under
          the <a href={projectLinks.license}>MIT License</a>, which permits use,
          modification and distribution subject to keeping its copyright and
          permission notice. It is provided as is, without warranties; the
          license contains the full warranty disclaimer and limitation of liability.
          This summary does not replace or add restrictions to that license.
        </p>
        <p>
          Dependencies and sample media have their own licenses, recorded in
          the <a href={projectLinks.thirdParty}>third-party notices</a>. The
          demonstration catalog includes fictional metadata and CC0 sample
          footage; it does not represent a catalog of publicly uploaded user videos.
        </p>
      </section>
      <section>
        <h2>Independent project and external services</h2>
        <p>
          Skeuo Video is an independent project, not affiliated with, endorsed
          by, or connected to YouTube or Google. Its interface and branding are
          original. External services, including GitHub and the website host,
          have their own terms and privacy practices.
        </p>
        <p>
          Project information and contributions are available in the{' '}
          <a href={projectLinks.repository}>GitHub repository</a>.
        </p>
      </section>
    </InformationPage>
  );
}
