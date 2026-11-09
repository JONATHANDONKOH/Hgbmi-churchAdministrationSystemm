import SharedAttendance from '../Shared/sharedattendance.jsx';

export default function MinistryAttendancePage({ groupId }) {
  return (
    <SharedAttendance
      groupId={groupId}
      groupType="ministry"
    />
  );
}