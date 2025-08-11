export async function generateStaticParams() {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < 8; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates.map((date) => ({
    date: date,
  }));
}

export default function Page({ params }: { params: { date: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Detail for {params.date}</h1>
      {/* ここに詳細情報を表示するコンテンツを追加します */}
    </div>
  );
}