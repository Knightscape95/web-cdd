import { NavLink } from 'react-router-dom'
import { Home, History, Settings, Cloud, IndianRupee } from 'lucide-react'

function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'मुख्यपृष्ठ', labelEn: 'Home' },
    { to: '/mandi', icon: IndianRupee, label: 'मंडी भाव', labelEn: 'Mandi' },
    { to: '/weather', icon: Cloud, label: 'हवामान', labelEn: 'Weather' },
    { to: '/history', icon: History, label: 'इतिहास', labelEn: 'History' },
    { to: '/settings', icon: Settings, label: 'सेटिंग्ज', labelEn: 'Settings' },
  ]

  return (
    <nav className="nav-bottom">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
              isActive
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-primary-600'
            }`
          }
        >
          <item.icon size={24} />
          <span className="text-xs mt-1 font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
