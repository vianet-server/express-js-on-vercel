import { useParams } from 'react-router-dom';

export function UserProfile() {
  const { userId } = useParams();

  return (
    <div>
      <h2>User Profile</h2>
      <p>Currently viewing profile of user ID: <strong>{userId}</strong></p>
    </div>
  );
}
