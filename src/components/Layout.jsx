import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Admin Panel</div>
        <nav className="sidebar-nav">
          <NavLink to="/articles" className={({ isActive }) => (isActive ? 'active' : '')}>
            Articles
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => (isActive ? 'active' : '')}>
            Gallery
          </NavLink>
          <NavLink to="/bio" className={({ isActive }) => (isActive ? 'active' : '')}>
            Bio
          </NavLink>
          <NavLink to="/sponsors" className={({ isActive }) => (isActive ? 'active' : '')}>
            Sponsors
          </NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
