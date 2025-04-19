import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

const menuData = [
  {
    label: "Dashboard",
    link: "/dashboard",
  },
  {
    label: "Users",
    children: [
      {
        label: "List Users",
        link: "/users/list",
      },
      {
        label: "Roles",
        children: [
          {
            label: "Admin Roles",
            link: "/users/roles/admin",
          },
          {
            label: "User Roles",
            link: "/users/roles/user",
          },
        ],
      },
    ],
  },
  {
    label: "Settings",
    children: [
      {
        label: "Profile",
        link: "/settings/profile",
      },
      {
        label: "Security",
        children: [
          {
            label: "Change Password",
            link: "/settings/security/password",
          },
          {
            label: "2FA",
            link: "/settings/security/2fa",
          },
        ],
      },
    ],
  },
  {
    label: "Upload File",
    link: "/upload",
  },
];

function NextMenu({ items, level = 0 }) {
  const [openIndex, setOpenIndex] = useState(null);
  const location = useLocation();
  return (
    <ul className={`pl-${level * 4} space-y-1`}> {/* Tailwind for indentation */}
      {items.map((item, idx) => {
        const isActive = item.link && location.pathname === item.link;
        return (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  className={`flex items-center w-full text-left px-2 py-1 rounded hover:bg-blue-100 ${level === 0 ? "font-bold" : "font-normal"} ${openIndex === idx ? "bg-blue-50" : ""}`}
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                >
                  <span className="flex-1">{item.label}</span>
                  <span>{openIndex === idx ? "▼" : "▶"}</span>
                </button>
                {openIndex === idx && (
                  <NextMenu items={item.children} level={level + 1} />
                )}
              </div>
            ) : (
              <Link
                to={item.link}
                className={`block px-2 py-1 rounded hover:bg-blue-50 ${level === 0 ? "font-bold" : "font-normal"} ${isActive ? "bg-blue-600 text-white" : ""}`}
              >
                {item.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Responsive: sidebar is always open on md+ screens, togglable on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Hamburger button only on mobile, absolutely positioned at extreme top left */}
      <button
        className="fixed top-0 left-0 z-50 p-2 rounded bg-blue-600 text-white shadow-lg md:hidden focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{ top: 0, left: 0, margin: 0 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        {/* Use Heroicons outline menu icon for hamburger (Tailwind recommended) */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5m-16.5 5.25h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      {/* Sidebar: always visible on md+, slide in/out on mobile, always at extreme left */}
      <aside
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-700 to-blue-400 dark:from-gray-900 dark:to-gray-800 border-r shadow flex flex-col z-40 transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ minWidth: 256, left: 0 }}
      >
        <div className="p-4 text-xl font-extrabold text-white border-b border-blue-300 flex items-center justify-between bg-blue-700 dark:bg-gray-900">
          App Menu
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <NextMenu items={menuData} />
        </nav>
        <div className="p-4 border-t border-blue-300 dark:border-gray-700 flex items-center justify-between">
          <span className="text-white dark:text-gray-200 text-sm">Theme</span>
          <button
            className="ml-2 px-2 py-1 rounded bg-white dark:bg-gray-700 text-blue-700 dark:text-yellow-300 font-bold focus:outline-none border border-blue-200 dark:border-gray-600"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </aside>
      {/* Overlay for mobile when sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
