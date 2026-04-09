import React from "react";
import AdminSidebar from "./_components/admin-sidebar";

function Layout({ children }) {
  return (
    <section className="relative pb-16">
      <div className="container relative mt-10">
        <div className="lg:flex">
          {/* Sticky Sidebar */}
          <div className="lg:w-1/4 md:px-3">
            <div className="sticky top-36">
              <AdminSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4 mt-[30px] lg:mt-0">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Layout;
