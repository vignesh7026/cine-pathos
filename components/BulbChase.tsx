export default function BulbChase({ count = 14 }: { count?: number }) {
  return (
    <div className="bulb-strip" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="bulb animate-bulbChase"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}