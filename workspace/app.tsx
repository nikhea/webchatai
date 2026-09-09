export function Dashboard({ metrics }: { metrics: { users: number; retention: number } }) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p>Users: {metrics.users.toLocaleString()}</p>
      <p>Retention: {(metrics.retention * 100).toFixed(0)}%</p>
    </div>
  );
}
