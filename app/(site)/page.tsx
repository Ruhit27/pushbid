import { BoardPage, parsePositiveInt } from "./_board-page";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  return <BoardPage board="all-time" page={parsePositiveInt(sp.page) ?? 1} amount={parsePositiveInt(sp.amount)} />;
}
