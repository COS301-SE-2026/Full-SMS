import Image from "next/image";
import { Button } from "@/components/ui";
import { redirect } from "next/navigation";

export default function Home() {
  redirect('/login')
}
