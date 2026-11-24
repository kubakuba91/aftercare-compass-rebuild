import { redirect } from "next/navigation";

// Pennsylvania licensing opens in the resources locator with the state and topic preserved.
export default function DdapLicensingRedirect() {
  redirect("/resources?state=PA&tab=licensing");
}
