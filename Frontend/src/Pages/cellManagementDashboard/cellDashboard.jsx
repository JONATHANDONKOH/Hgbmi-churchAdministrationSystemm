import GroupPerformanceDashboard from '../Shared/GroupPerformanceDashboard';

const CellPerformanceDashboard = ({ groupId }) => {
  return (
    <GroupPerformanceDashboard
      groupId={groupId}
      expectedGroupType="cell"
    />
  );
};

export default CellPerformanceDashboard;