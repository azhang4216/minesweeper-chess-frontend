import { Navigate } from "react-router-dom";
import { useIsLoggedIn } from '../../hooks';

export default function ProtectedLoginRoute({ children }) {
    const isLoggedIn = useIsLoggedIn();

    if (!isLoggedIn) {
        // If not logged in, kick them to the sign-in page
        return <Navigate to="/sign-in" replace />;
    }

    // Otherwise, show the page
    return children;
}
