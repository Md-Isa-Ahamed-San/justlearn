export const dynamic = 'force-dynamic';

import { MainNav } from "../../components/main-nav";
import { getServerUserData } from "../../queries/users";
import Sidebar from "./_components/sidebar";
const DashboardLayout = async ({ children }) => {
  let serverUserData = null;

  try {
    serverUserData = await getServerUserData();
  } catch (error) {
    // During static generation, this might fail
    console.log(
      "Could not fetch server user data during build:",
      error.message
    );
    serverUserData = null;
  }

  return (
  <div className="h-screen flex flex-col">
    <header className=" border-b shadow-sm z-10"> {/* Optional: Add background color/shadow to the header */}
      <div className="container flex h-20 items-center justify-between py-2 px-4 w-full"> {/* Adjusted height and padding */}
        <MainNav />
      </div>
    </header>

    <div className="flex flex-1 overflow-hidden"> {/* Added overflow hidden */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 border-r"> {/* flex-shrink-0 prevents sidebar from shrinking*/}
        <Sidebar />
      </aside>

      <main className="flex-1 overflow-y-auto p-4"> {/* flex-1 makes main take remaining space; added p-4 for padding, overflow-y-auto for scrollbar if needed */}
        {children}
      </main>
    </div>
  </div>
);
};
export default DashboardLayout;
