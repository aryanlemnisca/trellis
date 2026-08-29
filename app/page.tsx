import { Faq } from "@/components/faq/Faq";
import { Footer } from "@/components/footer/Footer";
import { Stage } from "@/components/stage/Stage";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-paper">
      <Stage />
      <Faq />
      <Footer />
    </main>
  );
}
