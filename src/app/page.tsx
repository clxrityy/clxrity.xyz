// import Preview from "@/archive/Preview";
// import { audioItems } from "@/config";
import Content from "@/components/blocks/Content";
import Hero from "@/components/blocks/Hero";

export default function Home() {
  return (
    <main className="relative mx-auto">
      <div className="container">
        <Hero />
        <div className="wrapper">
          {/* <Preview items={audioItems} /> */}
          <Content />

          <h1 className="animate-pulse">
            COMING SOON...
          </h1>
        </div>
      </div>
    </main>
  )
}