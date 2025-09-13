import Link from "next/link";
import IconGithub from "./icons/IconGithub";
import IconDiscord from "./icons/IconDiscord";
import { GITHUB_URL, DISCORD_SERVER_URL } from "@/lib/config/urls";

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container row">
                <div className="brand">hbd</div>
                <nav className="nav">
                    <Link href="/commands">Commands</Link>
                    <Link href="/privacy">Privacy</Link>
                    <Link href="/terms">Terms</Link>
                    <a href={DISCORD_SERVER_URL} target="_blank" rel="noreferrer noopener" aria-label="Discord"><IconDiscord size={16} /></a>
                    <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" aria-label="GitHub"><IconGithub size={16} /></a>
                </nav>
            </div>
        </footer>
    );
}
