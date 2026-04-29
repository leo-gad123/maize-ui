import { MaizeDetector } from "@/components/MaizeDetector";
import maizeBg from "@/assets/maize-bg.jpg";

const Index = () => {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed bg-no-repeat relative"
      style={{ backgroundImage: `url(${maizeBg})` }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full">
        <MaizeDetector />
      </div>
    </main>
  );
};

export default Index;
