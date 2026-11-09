import SharedMembersDandM from '../Shared/sharedmembersD&M.jsx';

export default function MinistryMembers({ groupId, onMessage }) {
  return (
    <SharedMembersDandM
      groupId={groupId}
      groupType="ministry"
      onMessage={onMessage}
    />
  );
}