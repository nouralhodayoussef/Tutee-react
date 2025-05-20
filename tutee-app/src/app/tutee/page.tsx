import TuteeHome from "@/components/pages/Tutee/TuteeHome";
import RoleProtected from "@/components/security/RoleProtected";
export default function TuteePage() {
  return (
    <RoleProtected requiredRoles={['tutee']}>
      <TuteeHome />
    </RoleProtected>
  );
}
