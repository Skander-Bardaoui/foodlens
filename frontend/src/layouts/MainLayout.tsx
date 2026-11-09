import { Outlet } from "react-router-dom";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-surface">
      <Navbar />
      <main className="w-full flex-1 pt-16">
        <div className="mx-auto w-full max-w-content px-4 pb-24 pt-8 md:px-8 md:pb-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
