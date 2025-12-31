import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Map, Calculator, Home, LucideIcon } from 'lucide-react-native';
import menuConfig from '../../config/menu.json';

// Map icon names to Lucide components
const iconComponents: Record<string, LucideIcon> = {
  map: Map,
  calculator: Calculator,
  home: Home,
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const IconComponent = iconComponents[name] || Home;

  return (
    <IconComponent
      size={24}
      color={focused ? '#3b82f6' : '#9ca3af'}
      strokeWidth={focused ? 2.5 : 2}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: '#ffffff',
          },
          android: {
            backgroundColor: '#ffffff',
            elevation: 0,
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
          },
          web: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
          },
        }),
      }}>
      {menuConfig.menuItems.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            href: item.href,
            tabBarIcon: ({ focused }) => <TabIcon name={item.icon} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
