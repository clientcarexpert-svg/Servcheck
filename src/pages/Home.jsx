import { useAuth } from "@/lib/AuthContext";
import CustomerHome from "./CustomerHome";
import MechanicHome from "./MechanicHome";
import LoggedInHome from "./LoggedInHome";
import InstallAppPrompt from "@/components/InstallAppPrompt";

export default function Home() {
  const { user } = useAuth();

  let page;
  if (user?.role === "mechanic") page = <MechanicHome />;
  else if (user) page = <LoggedInHome />;
  else page = <CustomerHome />;

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <InstallAppPrompt />
      </div>
      {page}
    </>
  );
}