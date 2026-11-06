import SharedMembersDandM from '../Shared/sharedmembersD&M.jsx';

export default function DepartmentMembers({ groupId, onMessage }) {
  return (
    <SharedMembersDandM
      groupId={groupId}
      groupType="department"
      onMessage={onMessage}
    />
  );
}