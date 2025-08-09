import { Link } from "react-router-dom";
import Logo from "../Logo";

function AdminNavbar() {
  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-slate-300/30">
      <Link to="/">
        <Logo size="lg" className="cursor-pointer" />
      </Link>
    </div>
  );
}

export default AdminNavbar;
