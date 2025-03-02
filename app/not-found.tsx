import "@/styles/404.css";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <div className="noise" />
      <div className="overlay" />
      <div className="terminal">
        <h1 className="text-4xl mb-5">
          Error <span className="errorcode">404</span>
        </h1>
        <p className="output">
          The page you are looking for might have been removed, had its name
          changed or is temporarily unavailable.
        </p>
        <p className="output">
          Please try to <Link href="/">return to the homepage</Link>.
        </p>
        <p className="output">Good luck.</p>
      </div>
    </>
  );
}
