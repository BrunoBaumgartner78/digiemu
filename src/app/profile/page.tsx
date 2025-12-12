import { redirect } from "next/navigation";

// Hält den Profil-Button im Header lebendig,
// leitet aber auf dein echtes Dashboard-Profil um.
export default function ProfileRedirectPage() {
  redirect("/dashboard/profile");
}
