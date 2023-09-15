import Button from "@/components/Button";
import Hero from "@/components/Hero";
import Login from "@/components/Login";


export default function Home() {
  return (
    <div className="flex flex-col md:flex-row items-center">
      <Hero />
      <div className="flex flex-col lg:flex-row items-center justify-center gap-14">
        <div className="flex flex-col space-y-10 items-center">
          <Button shadow="purple" link="/">
            Vocals
          </Button>
          <Button shadow="blue" link="/">
            Loops
          </Button>
        </div>

        <div>
          <Login />
        </div>
      </div>
    </div>
  )
}
