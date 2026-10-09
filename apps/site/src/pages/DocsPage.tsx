import { DocsPageLayout } from '../components/DocsPageLayout';
import { DocsHeading } from '../components/DocsHeading';
import { useLocale } from '../context/LocaleContext';
import { RichText } from '../lib/richText';
import { slugifyHeading } from '../lib/slugify';

export function DocsPage() {
  const { content, locale } = useLocale();
  const { docs } = content;

  return (
    <DocsPageLayout>
      <h1>{docs.intro.heading}</h1>
      <p>{docs.intro.lead}</p>

      <DocsHeading as="h2" id="quickstart">
        {docs.quickstart.heading}
      </DocsHeading>
      <ol>
        {docs.quickstart.steps.map((step) => (
          <li key={step}>
            <RichText text={step} />
          </li>
        ))}
      </ol>

      <DocsHeading as="h2" id="concepts">
        {docs.concepts.heading}
      </DocsHeading>
      {docs.concepts.items.map((item) => (
        <section key={item.title}>
          <DocsHeading as="h3" id={slugifyHeading(item.title)}>
            {item.title}
          </DocsHeading>
          <p>
            <RichText text={item.body} />
          </p>
        </section>
      ))}

      <DocsHeading as="h2" id="self-hosting">
        {docs.selfHosting.heading}
      </DocsHeading>
      <p>{docs.selfHosting.intro}</p>
      {docs.selfHosting.envGroups.map((group) => (
        <section key={group.title}>
          <DocsHeading as="h3" id={slugifyHeading(group.title)}>
            {group.title}
          </DocsHeading>
          <table className="env-table">
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">{locale === 'de' ? 'Bedeutung' : 'Description'}</th>
              </tr>
            </thead>
            <tbody>
              {group.vars.map((v) => (
                <tr key={v.name}>
                  <td>
                    <code>{v.name}</code>
                  </td>
                  <td>{v.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </DocsPageLayout>
  );
}
