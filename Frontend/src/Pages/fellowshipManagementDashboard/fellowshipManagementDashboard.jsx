import GroupPerformanceDashboard from '../Shared/GroupPerformanceDashboard';

const FellowshipPerformanceDashboard = ({ groupId }) => {
  return (
    <GroupPerformanceDashboard
      groupId={groupId}
      expectedGroupType="fellowship"
    />
  );
};

export default FellowshipPerformanceDashboard;