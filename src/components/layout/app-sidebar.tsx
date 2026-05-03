import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-2" />
      <SidebarContent>{/* Week 3에 도메인 그룹 + 노드 tree 채움 */}</SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
