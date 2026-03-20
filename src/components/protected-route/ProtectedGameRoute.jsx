import { Navigate } from "react-router-dom";
import { useIsLoggedIn, useIsAuthLoading } from '../../hooks';

export default function ProtectedGameRoute({ children }) {
    const isLoggedIn = useIsLoggedIn();
    const isAuthLoading = useIsAuthLoading();

    if (isAuthLoading) return null;
    if (!isLoggedIn) return <Navigate to="/" replace />;
    return children;
}
