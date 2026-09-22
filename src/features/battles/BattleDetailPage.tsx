import { useParams } from "react-router";

export function BattleDetailPage() {
  const { battleId } = useParams<"battleId">();

  return (
    <section>
      <h1>Battle</h1>
      <p>
        Replay for battle
        {battleId}
        {" "}
        coming soon.
      </p>
    </section>
  );
}
