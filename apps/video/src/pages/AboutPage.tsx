import { Link } from 'react-router-dom';
import { InformationPage } from '../components/InformationPage';
import { projectLinks } from '../lib/projectLinks';

export function AboutPage() {
  return (
    <InformationPage title="About Skeuo Video">
      <p className="lede">Just videos. Like the old days.</p>
      <section>
        <h2>A familiar place to watch</h2>
        <p>
          Skeuo Video is an independent, open-source video library inspired by
          the web of 2008–2010. Browse by category, search, make playlists and
          follow channels, with a classic blue-and-gray interface and no infinite feed.
          It is part of Skeuo: the internet, like it used to feel.
        </p>
      </section>
      <section>
        <h2>Your own video shelf</h2>
        <p>
          <Link to="/my-videos">My Videos</Link> imports your files into this
          browser for playback. Importing does not publish them or send them to a
          server. Your library stays with this browser and website address; it
          does not sync to another device. Keep the original files as a backup.
          Read <Link to="/privacy">Privacy</Link> for storage and deletion details.
        </p>
      </section>
      <section>
        <h2>What is a demonstration?</h2>
        <p>
          This is a working frontend prototype. Profiles, subscriptions, votes,
          comments and playlists are local demonstrations, with no server accounts
          or public posting. The separate Upload page simulates an upload; use My
          Videos for a library that can survive a reload.
        </p>
        <p>
          Catalog entries marked Demo have fictional titles and statistics and
          play a CC0 stand-in clip. The Flower sample describes its actual footage.
          Your imported videos play your own files. Media sources and dependency
          licenses are listed in the <a href={projectLinks.thirdParty}>third-party notices</a>.
        </p>
      </section>
      <section>
        <h2>Built in the open</h2>
        <p>
          Explore the <a href={projectLinks.repository}>GitHub repository</a>,
          read the <a href={projectLinks.contributions}>contribution guide</a> or{' '}
          <a href={projectLinks.reportBug}>report a bug</a>. Code is available under
          the <a href={projectLinks.license}>MIT License</a>.
        </p>
        <p>
          Skeuo branding and interface artwork are original to this project.
          Skeuo is not affiliated with, endorsed by, or connected to YouTube or Google.
        </p>
      </section>
    </InformationPage>
  );
}
