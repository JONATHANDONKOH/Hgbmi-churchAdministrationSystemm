import SharedAttendance from '../Shared/sharedattendance.jsx';

export default function CellAttendancePage({ groupId }) {
  return (
    <SharedAttendance
      groupId={groupId}
      groupType="cell"
    />
  );
}