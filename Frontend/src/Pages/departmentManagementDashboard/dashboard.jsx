import GroupPerformanceDashboard from '../Shared/GroupPerformanceDashboard';

const DepartmentPerformanceDashboard = ({ groupId }) => {
  return (
    <GroupPerformanceDashboard
      groupId={groupId}
      expectedGroupType="department"
    />
  );
};

export default DepartmentPerformanceDashboard;