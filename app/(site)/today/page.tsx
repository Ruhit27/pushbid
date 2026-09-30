import type { Metadata } from "next";
import { BoardPage, parsePositiveInt } from "../_board-page";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const sp = await searchParams;
  return <BoardPage board="today" page={1} amount={parsePositiveInt(sp.amount)} />;
}
