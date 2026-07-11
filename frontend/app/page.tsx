import Hero from "@/components/landing/hero";
import NavBar from "@/components/landing/navBar";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function Home() {
  return(
    <>
      <NavBar/>
      <Hero/>
    </>

  )
}
