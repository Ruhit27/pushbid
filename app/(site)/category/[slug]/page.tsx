import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/boards";
import { BoardPage, parsePositiveInt } from "../../_board-page";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return (
    <BoardPage
      board={sp.board === "today" ? "today" : "all-time"}
      category={category}
      page={parsePositiveInt(sp.page) ?? 1}
      amount={parsePositiveInt(sp.amount)}
    />
  );
}
