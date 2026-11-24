import { redirect } from "next/navigation";

// The Pennsylvania DDAP guide now lives in the state picker on the recovery house owners page.
export default function DdapLicensingRedirect() {
  redirect("/resources/recovery-house-owners?state=PA#state");
}
