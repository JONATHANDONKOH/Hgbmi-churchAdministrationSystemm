import SharedAttendance from '../Shared/sharedattendance.jsx';

export default function FellowshipAttendancePage({ groupId }) {
  return (
    <SharedAttendance
      groupId={groupId}
      groupType="fellowship"
    />
  );
}