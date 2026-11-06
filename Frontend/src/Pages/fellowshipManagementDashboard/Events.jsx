
import SharedEvents from '../Shared/sharedEvents.jsx';

export default function FellowshipEvents({ groupId, groupName }) {
  return (
    <SharedEvents
      groupId={groupId}
      groupType="fellowship"
      groupName={groupName}
    />
  );
}
