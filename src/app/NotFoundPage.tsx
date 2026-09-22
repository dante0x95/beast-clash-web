import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>This arena does not exist.</p>
      <Link to="/monsters">Back to monsters</Link>
    </section>
  );
}
