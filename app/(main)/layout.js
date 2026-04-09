export const dynamic = 'force-dynamic';

import { MainNav } from "@/components/main-nav";
import { FooterController } from "../../components/footer-controller";
import { getServerUserData } from "../../queries/users";

const MainLayout = async ({ children }) => {
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
    <div className="flex min-h-screen flex-col">
      <header className="z-40 bg-background/60 backdrop-blur-md fixed top-0 left-0 right-0 border-b h-24">
        <div className="container flex h-24 items-center justify-between py-6 ">
          <MainNav  />
        </div>
      </header>
      <main className="flex-1 pt-20 flex flex-col">{children}</main>

      {/* <SiteFooter /> */}
      <FooterController />
    </div>
  );
};
export default MainLayout;
