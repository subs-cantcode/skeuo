import { Link } from 'react-router-dom';
import { InformationPage } from '../components/InformationPage';
import { projectLinks } from '../lib/projectLinks';

export function PrivacyPage() {
  return (
    <InformationPage title="Privacy">
      <p className="lede">How this version of Skeuo Video handles your files and browser data.</p>
      <p className="meta">Last updated: November 24, 2026.</p>
      <section>
        <h2>Your imported videos stay in this browser</h2>
        <p>
          When you import a file through <Link to="/my-videos">My Videos</Link>,
          Skeuo saves a copy of its video bytes, title, description, filename,
          media details and generated poster in IndexedDB, your browser’s local
          database. The app does not upload these files or their library metadata
          to a server, publish them, or sync them to other devices.
        </p>
        <p>
          Storage belongs to this browser profile and website origin (the
          protocol, hostname and port). A different browser, device or Vercel
          preview hostname has a separate library. Signing out does not erase
          imported videos or protect them from someone using the same browser profile.
          Local storage is not an encrypted vault or a backup service.
        </p>
      </section>
      <section>
        <h2>Other local data</h2>
        <p>
          Local profile details, subscriptions, votes, comments, playlists and
          simulated upload details are saved in localStorage, another browser
          store. Some interface preferences are saved there too. These actions
          are not posted to a shared service. Signing in creates a local profile;
          it is not server authentication.
        </p>
        <p>
          The Upload page is a simulation. Its temporary attachment can stop
          playing after a reload; its saved details do not preserve the video
          bytes. Use My Videos to import a persistent local copy instead.
        </p>
      </section>
      <section>
        <h2>Keeping and removing your data</h2>
        <p>
          Delete an imported video in My Videos to remove its stored copy,
          poster and library details. This does not delete your original file.
          To remove all Skeuo data for this address, clear this site’s storage
          in your browser settings, including IndexedDB and localStorage, then
          close its open tabs. Sign-out alone does not clear all saved activity.
        </p>
        <p>
          Browser storage can be cleared by you or evicted by the browser.
          Private browsing and storage limits can prevent saving or shorten
          retention. My Videos can request persistent storage, but the browser
          decides whether to grant it; this is not a backup guarantee. Keep your
          original files. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria">MDN’s browser storage guide</a>.
        </p>
      </section>
      <section>
        <h2>Requests outside your device</h2>
        <p>
          Loading this website makes requests to Vercel, our host. Demo playback
          fetches example videos from interactive-examples.mdn.mozilla.net.
          Those providers receive ordinary request information such as your IP
          address and browser headers. Local video playback uses the stored file
          instead of uploading it. The application includes no advertising or
          analytics SDK.
        </p>
        <p>
          Hosting is covered by <a href="https://vercel.com/legal/privacy-notice">Vercel’s Privacy Notice</a>.
          Links to GitHub and other sites take you to services with their own
          privacy practices. This page describes the app’s current behavior; it
          does not promise that hosting or external services keep no logs.
        </p>
      </section>
      <section>
        <h2>Questions and bug reports</h2>
        <p>
          You can <a href={projectLinks.reportBug}>report a bug on GitHub</a>.
          GitHub issues are public: do not attach private videos, personal
          information or browser storage dumps. Maintainers cannot retrieve or
          recover a library that exists only in your browser.
        </p>
      </section>
    </InformationPage>
  );
}
