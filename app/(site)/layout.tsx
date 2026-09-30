import { AutoRefresh } from "@/app/_components/AutoRefresh";
import { Footer } from "@/app/_components/Footer";
import { Header } from "@/app/_components/Header";
import { Welcome } from "@/app/_components/Welcome";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Footer />
      <Welcome />
      <AutoRefresh seconds={15} />
    </>
  );
}
