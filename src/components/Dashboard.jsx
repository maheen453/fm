import React, { useEffect, useState } from "react";

const Dashboard = () => {
    const [user, setUser] = useState("");

    useEffect(() => {
        fetch("/api/user")
            .then((res) => res.json())
            .then((data) => setUser(data.user))
            .catch((err) => console.error("Error fetching user:", err));
    }, []);

    return (
        <div>
            <h1>Hello {user.charAt(0).toUpperCase() + user.slice(1)}</h1>
            <p style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <a href="/users/logout" style={{ color: "lightblue", textDecoration: "underline" }}>
                    Logout
                </a>
            </p>
        </div>
    );
};

export default Dashboard;
