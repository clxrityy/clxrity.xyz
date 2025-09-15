import { DISCORD_SERVER_URL, GITHUB_URL } from "@/lib/config/urls";

type Section = { id: string; title: string; body: React.ReactNode };

const sections: Section[] = [
    {
        id: 'introduction',
        title: 'Introduction',
        body: (
            <p>
                Welcome to <strong>hbd</strong>, a Discord bot designed to help communities celebrate member birthdays. By
                adding or using hbd in a Discord server (&quot;Guild&quot;), you agree to these Terms of Service (&quot;Terms&quot;) and our <a href="#privacy">Privacy Policy</a>. If you do not agree, you should remove the bot from your server and cease using its commands.
            </p>
        )
    },
    {
        id: 'eligibility',
        title: 'Eligibility & Scope',
        body: (
            <p>
                You must comply with the <a href="https://discord.com/terms" rel="noopener noreferrer" target="_blank">Discord Terms of Service</a>, <a href="https://discord.com/guidelines" rel="noopener noreferrer" target="_blank">Community Guidelines</a>, and all applicable laws. These Terms
                apply to server administrators, moderators configuring the bot, and end users invoking commands.
            </p>
        )
    },
    {
        id: 'features',
        title: 'Core Features',
        body: (
            <ul className="list-disc pl-5 space-y-1">
                <li>Users can set a birthday (month and day) if the server allows changes.</li>
                <li>Server configuration can enable announcement channels and optional birthday roles.</li>
                <li>Utility commands: view birthday, days until, list birthdays happening today.</li>
            </ul>
        )
    },
    {
        id: 'data-collected',
        title: 'Data Collected',
        body: (
            <>
                <p>The bot stores only the minimal data required to function:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><code>userId</code> (Discord snowflake)</li>
                    <li><code>guildId</code> (Discord snowflake)</li>
                    <li><code>month</code> &amp; <code>day</code> of the submitted birthday (no year)</li>
                    <li>Guild configuration (admin role, birthday role, announcement channel, template/message flags)</li>
                    <li>Timestamps for creation &amp; updates</li>
                </ul>
                <p className="mt-3">
                    The bot does <strong>not</strong> store message content, does not track activity beyond explicit interactions,
                    and does not intentionally collect age or full dates of birth.
                </p>
            </>
        )
    },
    {
        id: 'data-use',
        title: 'How Data Is Used',
        body: (
            <>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Scheduling and generating birthday announcements in configured channels.</li>
                    <li>Displaying a user’s birthday back to them via commands or components.</li>
                    <li>Enforcing server rules about whether birthdays can be changed.</li>
                </ul>
                <p className="mt-3">Data is not sold or shared with third parties.</p>
            </>
        )
    },
    {
        id: 'user-responsibilities',
        title: 'User Responsibilities',
        body: (
            <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate birthday information (month/day only) if you choose to set one.</li>
                <li>Do not abuse the bot for spam or harassment.</li>
                <li>Respect privacy—do not pressure others to disclose a date.</li>
            </ul>
        )
    },
    {
        id: 'server-admins',
        title: 'Server Administrator Responsibilities',
        body: (
            <ul className="list-disc pl-5 space-y-1">
                <li>Obtain any required consent from server members for storing birthday dates.</li>
                <li>Regularly review announcement channels and configuration for correctness.</li>
                <li>Remove the bot if it no longer aligns with your community standards.</li>
            </ul>
        )
    },
    {
        id: 'privacy',
        title: 'Privacy Policy',
        body: (
            <p>
                This Privacy Policy describes how hbd processes limited personal data (Discord identifiers and birthday month &
                day). Data is processed solely to provide core functionality (announcements, queries, countdowns). We rely on
                a legitimate interest basis in operating a voluntary utility service. You may request deletion by clearing
                your birthday (if a command is later provided) or contacting the operator (see Contact section).
            </p>
        )
    },
    {
        id: 'data-retention',
        title: 'Data Retention & Deletion',
        body: (
            <p>
                Data is retained while the bot is present in the guild and the record remains relevant. If the bot is
                removed from a guild, operational cleanup may purge associated birthdays and configuration periodically.
            </p>
        )
    },
    {
        id: 'security',
        title: 'Security',
        body: (
            <p>
                Reasonable technical measures (least-privilege database access, isolation of runtime components) are employed.
                However, no system is perfectly secure and no guarantees are made.
            </p>
        )
    },
    {
        id: 'third-parties',
        title: 'Third-Party Services',
        body: (
            <p>
                hbd relies on Discord APIs and a managed database provider. Their independent terms and privacy policies also
                apply. Birthday announcements appear in Discord channels and are subject to Discord content policies.
            </p>
        )
    },
    {
        id: 'limitations',
        title: 'Limitations of Liability',
        body: (
            <p>
                hbd is provided “AS IS” without warranties of any kind. To the maximum extent permitted by law, the operator
                shall not be liable for indirect, incidental, or consequential damages arising from use of the bot.
            </p>
        )
    },
    {
        id: 'termination',
        title: 'Termination',
        body: (
            <p>
                We may restrict or revoke access to the bot for abuse, security risk, legal compliance, or inactivity. You may
                remove the bot at any time to terminate your participation.
            </p>
        )
    },
    {
        id: 'changes',
        title: 'Changes to These Terms',
        body: (
            <p>
                We may revise these Terms or the Privacy Policy by updating this page. Material changes may be signaled via
                a changelog or announcement. Continued use after changes constitutes acceptance.
            </p>
        )
    },
    {
        id: 'contact',
        title: 'Contact',
        body: (
            <div>
                <h4>
                    For questions, ideas, bugs/issues, data access, or deletion requests:
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        Join the <a href={DISCORD_SERVER_URL} target="_blank" rel="noreferrer noopener">support server</a>.
                    </li>
                    <li>
                        <a href="mailto:contact@mjanglin.com" target="_blank" rel="noreferrer noopener">Email</a> the operator.
                    </li>
                    <li>
                        Make an issue or pull request on <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">GitHub</a>.
                    </li>
                </ul>
            </div>
        )
    }
];

export default function Page() {
    const today = new Date().toISOString().slice(0, 10);
    return (
        <main id="top" className="legal-doc mx-auto max-w-3xl px-6 py-10 prose prose-invert">
            <header className="legal-header mb-10 pb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Terms of Service &amp; Privacy Policy</h1>
                <p className="mt-2 text-sm text-neutral-400">Last Updated: <strong>{today}</strong></p>
            </header>
            <nav aria-label="Table of contents" className="toc mb-12 p-5 text-sm">
                <p className="mb-2 font-semibold uppercase tracking-wide text-neutral-300">Contents</p>
                <ul className="space-y-1 list-decimal pl-4">
                    {sections.map(s => (
                        <li key={s.id}>
                            <a href={`#${s.id}`}>{s.title}</a>
                        </li>
                    ))}
                </ul>
            </nav>
            <article>
                {sections.map(section => (
                    <section key={section.id} id={section.id}>
                        <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold">
                            <span>{section.title}</span>
                            <a
                                href={`#${section.id}`}
                                aria-label="Link to section"
                                className="anchor-link text-xs rounded px-2 py-1 font-mono"
                            >#</a>
                        </h2>
                        <div className="space-y-3 leading-relaxed text-neutral-200 text-sm md:text-base">{section.body}</div>
                    </section>
                ))}
                <div className="mt-4">
                    <a href="#top" className="back-top text-neutral-500 hover:text-neutral-300">Back to top</a>
                </div>
            </article>
        </main>
    );
}