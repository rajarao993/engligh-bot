import { useEffect, useState } from "react";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/users")
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <div>
      <h1>📊 English Bot Dashboard</h1>

      {users.map(user => (
        <div key={user.id}>
          <p>{user.name}</p>
          <p>Usage: {user.count}</p>
        </div>
      ))}
    </div>
  );
}

export default App;