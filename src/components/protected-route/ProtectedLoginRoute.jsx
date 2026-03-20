import { Navigate } from "react-router-dom";
import { useIsLoggedIn, useIsAuthLoading } from '../../hooks';

export default function ProtectedLoginRoute({ children }) {
    const isLoggedIn = useIsLoggedIn();
    const isAuthLoading = useIsAuthLoading();

    if (isAuthLoading) {
        // Show nothing, spinner, or splash screen
        return <div>Loading...</div>;
    }

    if (!isLoggedIn) {
        return <Navigate to="/sign-in" replace />;
    }

    return children;
}
