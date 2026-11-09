import SharedEvents from '../Shared/sharedEvents.jsx';

export default function MinistryEvents({ groupId, groupName }) {
  return (
    <SharedEvents
      groupId={groupId}
      groupType="ministry"
      groupName={groupName}
    />
  );
}