import { useMonsters } from "./monsters.api";

export function MonsterList() {
  const { data, error, isPending } = useMonsters();

  if (isPending)
    return <p>Waking up the server… first load can take a few seconds.</p>;
  if (error)
    return <p role="alert">Could not load monsters: {error.message}</p>;
  if (data.items.length === 0) return <p>No monsters yet.</p>;

  return (
    <ul className="monster-grid">
      {data.items.map((monster) => (
        <li className="monster-card" key={monster.id}>
          <img
            alt={monster.name}
            height={96}
            src={monster.imageUrl}
            width={96}
          />
          <h3>{monster.name}</h3>
          <dl>
            <dt>HP</dt>
            <dd>{monster.hp}</dd>
            <dt>ATK</dt>
            <dd>{monster.attack}</dd>
            <dt>DEF</dt>
            <dd>{monster.defense}</dd>
            <dt>SPD</dt>
            <dd>{monster.speed}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
