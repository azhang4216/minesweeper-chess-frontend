import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedLoginRoute from './ProtectedLoginRoute';
import { useIsLoggedIn, useIsAuthLoading } from '../../hooks';

jest.mock('../../hooks', () => ({
    useIsLoggedIn: jest.fn(),
    useIsAuthLoading: jest.fn(),
}));

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route path="/sign-in" element={<div>Sign In Page</div>} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedLoginRoute>
                            <div>Dashboard Page</div>
                        </ProtectedLoginRoute>
                    }
                />
            </Routes>
        </MemoryRouter>
    );

describe('ProtectedLoginRoute', () => {
    beforeEach(() => {
        useIsLoggedIn.mockReturnValue(false);
        useIsAuthLoading.mockReturnValue(false);
    });

    test('renders "Loading..." when isAuthLoading is true', () => {
        useIsAuthLoading.mockReturnValue(true);
        renderRoute();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    test('redirects to /sign-in when not loading and not logged in', () => {
        renderRoute();
        expect(screen.getByText('Sign In Page')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    test('renders children when not loading and logged in', () => {
        useIsLoggedIn.mockReturnValue(true);
        renderRoute();
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
        expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
});
