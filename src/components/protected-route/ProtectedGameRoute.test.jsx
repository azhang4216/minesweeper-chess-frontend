import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedGameRoute from './ProtectedGameRoute';
import { useIsLoggedIn, useIsAuthLoading } from '../../hooks';

jest.mock('../../hooks', () => ({
    useIsLoggedIn: jest.fn(),
    useIsAuthLoading: jest.fn(),
}));

const renderRoute = () =>
    render(
        <MemoryRouter initialEntries={['/play-game']}>
            <Routes>
                <Route path="/" element={<div>Home Page</div>} />
                <Route
                    path="/play-game"
                    element={
                        <ProtectedGameRoute>
                            <div>Game Page</div>
                        </ProtectedGameRoute>
                    }
                />
            </Routes>
        </MemoryRouter>
    );

describe('ProtectedGameRoute', () => {
    beforeEach(() => {
        useIsLoggedIn.mockReturnValue(false);
        useIsAuthLoading.mockReturnValue(false);
    });

    test('renders nothing when isAuthLoading is true', () => {
        useIsAuthLoading.mockReturnValue(true);
        renderRoute();
        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
        expect(screen.queryByText('Game Page')).not.toBeInTheDocument();
    });

    test('redirects to / when not logged in', () => {
        renderRoute();
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.queryByText('Game Page')).not.toBeInTheDocument();
    });

    test('renders children when logged in', () => {
        useIsLoggedIn.mockReturnValue(true);
        renderRoute();
        expect(screen.getByText('Game Page')).toBeInTheDocument();
        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
    });
});
