import { redirect } from "next/navigation";

export default function ProfileRedirectPage() {
  redirect("/account/profile"); // oder "/dashboard/profile" – aber konsistent!
}
