import { AutoRefresh } from "@/app/_components/AutoRefresh";
import { Footer } from "@/app/_components/Footer";
import { Header } from "@/app/_components/Header";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <Footer />
      <AutoRefresh seconds={15} />
    </>
  );
}
