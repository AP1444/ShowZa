import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useUser, useClerk, UserButton } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";
import Logo from "./Logo";

function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();

  const navigate = useNavigate();
  const { favoritesMovies } = useAppContext();

  return (
    <div className="fixed top-4 max-md:left-2 max-md:right-2 md:left-20 md:right-20 z-40">
      <div
        className={`${
          isOpen ? "max-md:backdrop-blur-none" : "backdrop-blur-lg"
        } bg-white/10 border border-white/20 rounded-2xl px-6 max-md:py-4 md:py-3 flex items-center justify-between shadow-2xl`}
      >
        <Link
          to="/"
          className="max-md:flex-1 hover:scale-105 transition-transform duration-200"
        >
          <Logo size="lg" className="cursor-pointer" />
        </Link>

        <div
          className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg max-md:bg-white/10 max-md:backdrop-blur-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 max-md:px-8 py-3 max-md:h-screen transition-all duration-300 ${
            isOpen
              ? "max-md:w-full"
              : "max-md:hidden max-md:w-0 max-md:overflow-hidden"
          }`}
        >
          <XIcon
            className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer text-white/80 hover:text-white hover:scale-110 transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
          />

          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/"
            className="text-white/90 hover:text-white hover:scale-105 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/movies"
            className="text-white/90 hover:text-white hover:scale-105 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-white/10"
          >
            Movies
          </Link>
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/"
            className="text-white/90 hover:text-white hover:scale-105 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-white/10"
          >
            Theaters
          </Link>
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/"
            className="text-white/90 hover:text-white hover:scale-105 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-white/10"
          >
            Releases
          </Link>
          {favoritesMovies.length > 0 && (
            <Link
              onClick={() => {
                scrollTo(0, 0);
                setIsOpen(false);
              }}
              to="/favorite"
              className="text-white/90 hover:text-white hover:scale-105 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Favorite
            </Link>
          )}
        </div>

        <div className="flex items-center gap-6">
          <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer text-white/80 hover:text-white hover:scale-110 transition-all duration-200" />
          {!user ? (
            <button
              onClick={openSignIn}
              className="px-4 py-2 sm:px-6 sm:py-2.5 bg-primary hover:bg-primary-dull hover:scale-105 transition-all duration-200 rounded-full font-medium cursor-pointer text-white shadow-lg hover:shadow-xl"
            >
              Login
            </button>
          ) : (
            <div className="hover:scale-105 transition-transform duration-200">
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="My Bookings"
                    labelIcon={<TicketPlus width={15} />}
                    onClick={() => navigate("/my-bookings")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          )}
        </div>

        <MenuIcon
          className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer text-white/80 hover:text-white hover:scale-110 transition-all duration-200"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        />
      </div>
    </div>
  );
}

export default Navbar;
