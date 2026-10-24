import { redirect } from "next/navigation";

// O proxy já encaminha "/" para o dashboard ou para o login.
export default function Home() {
  redirect("/dashboard");
}
