
import SharedEvents from '../Shared/sharedEvents.jsx';

export default function CellEvents({ groupId, groupName }) {
  return (
    <SharedEvents
      groupId={groupId}
      groupType="cell"
      groupName={groupName}
    />
  );
}
