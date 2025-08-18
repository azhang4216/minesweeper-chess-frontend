import { Navigate } from "react-router-dom";
import { useIsLoggedIn, useIsAuthLoading } from '../../hooks';

export default function ProtectedLoginRoute({ children }) {
    const isLoggedIn = useIsLoggedIn();
    const isAuthLoading = useIsAuthLoading();
    console.log(`ProtectedLoginRoute: ${isLoggedIn} ${isAuthLoading}`);

    if (isAuthLoading) {
        // Show nothing, spinner, or splash screen
        return <div>Loading...</div>;
    }

    if (!isLoggedIn) {
        // If not logged in, kick them to the sign-in page
        console.log("Kick to sign-in page because user is not signed in.");
        return <Navigate to="/sign-in" replace />;
    }

    console.log("User is logged in, no need to renavigate to sign in page.");

    // Otherwise, show the page
    return children;
}
