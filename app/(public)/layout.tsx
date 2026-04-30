import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
