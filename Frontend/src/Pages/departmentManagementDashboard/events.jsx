
import SharedEvents from '../Shared/sharedEvents.jsx';

export default function DepartmentEvents({ groupId, groupName }) {
  return (
    <SharedEvents
      groupId={groupId}
      groupType="department"
      groupName={groupName}
    />
  );
}
