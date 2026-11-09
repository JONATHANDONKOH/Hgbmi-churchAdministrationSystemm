import GroupPerformanceDashboard from '../Shared/GroupPerformanceDashboard';

const MinistryPerformanceDashboard = ({ groupId }) => {
  return (
    <GroupPerformanceDashboard
      groupId={groupId}
      expectedGroupType="ministry"
    />
  );
};

export default MinistryPerformanceDashboard;