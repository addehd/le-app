# Menu Configuration Guide

Your app now uses **Lucide Icons** - a beautiful, consistent icon library with 1000+ icons.

## How to Add/Edit Menu Items

Edit `/config/menu.json`:

```json
{
  "menuItems": [
    {
      "name": "map",           // Route name (must match file in (tabs) folder)
      "title": "Karta",        // Display name in Swedish
      "href": "/map",          // Navigation path
      "icon": "map"            // Lucide icon name
    }
  ]
}
```

## Popular Lucide Icons for Your App

### Navigation & Location
- `map` - Map view
- `navigation` - GPS/Navigation
- `map-pin` - Location marker
- `compass` - Compass

### Finance & Money (Bolån)
- `calculator` - Calculator
- `trending-up` - Growth/Investment
- `banknote` - Money/Currency
- `wallet` - Wallet
- `landmark` - Bank building
- `chart-line` - Charts/Analytics
- `percent` - Percentage/Interest

### Home & Building
- `home` - Home icon
- `building` - Building
- `house` - House alternative
- `door-open` - Door

### User & Profile
- `user` - User profile
- `user-circle` - User with circle
- `users` - Multiple users
- `settings` - Settings

### Common Actions
- `search` - Search
- `bell` - Notifications
- `heart` - Favorites
- `bookmark` - Saved items
- `share` - Share
- `menu` - Menu/Hamburger
- `plus` - Add new
- `filter` - Filter

### Business
- `briefcase` - Business/Work
- `file-text` - Documents
- `clipboard` - Tasks
- `calendar` - Calendar
- `mail` - Email

## How to Use a New Icon

1. **Add to menu.json:**
   ```json
   {
     "name": "profile",
     "title": "Profil",
     "href": "/profile",
     "icon": "user-circle"
   }
   ```

2. **Import in `(tabs)/_layout.tsx`:**
   ```tsx
   import { Map, Calculator, Home, UserCircle } from 'lucide-react-native';

   const iconComponents: Record<string, LucideIcon> = {
     map: Map,
     calculator: Calculator,
     home: Home,
     'user-circle': UserCircle,  // Use the icon name from Lucide
   };
   ```

3. **Create the tab file:**
   Create `/app/(tabs)/profile.tsx`

## Full Icon List

Browse all 1000+ icons at: https://lucide.dev/icons

## Customizing Icon Appearance

In `(tabs)/_layout.tsx`, you can customize:

```tsx
<IconComponent
  size={24}                              // Icon size
  color={focused ? '#3b82f6' : '#9ca3af'}  // Blue when active, gray when inactive
  strokeWidth={focused ? 2.5 : 2}        // Thicker stroke when active
/>
```

## Color Palette (Tailwind Colors)

Your current colors:
- Active: `#3b82f6` (blue-500)
- Inactive: `#9ca3af` (gray-400)

Popular alternatives:
- Green: `#10b981` (emerald-500)
- Purple: `#8b5cf6` (violet-500)
- Orange: `#f97316` (orange-500)
- Red: `#ef4444` (red-500)

## Example: Swedish Real Estate App Menu

```json
{
  "menuItems": [
    {
      "name": "map",
      "title": "Karta",
      "href": "/map",
      "icon": "map"
    },
    {
      "name": "bolan",
      "title": "Bolån",
      "href": "/bidding",
      "icon": "calculator"
    },
    {
      "name": "home",
      "title": "Hem",
      "href": "/",
      "icon": "home"
    },
    {
      "name": "favorites",
      "title": "Favoriter",
      "href": "/favorites",
      "icon": "heart"
    },
    {
      "name": "profile",
      "title": "Profil",
      "href": "/profile",
      "icon": "user-circle"
    }
  ]
}
```
