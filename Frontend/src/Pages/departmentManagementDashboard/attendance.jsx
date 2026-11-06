import SharedAttendance from '../Shared/sharedattendance.jsx';

export default function DepartmentAttendancePage({ groupId }) {
  return (
    <SharedAttendance
      groupId={groupId}
      groupType="department"
    />
  );
}