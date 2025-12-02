import React from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-background text-white selection:bg-brand selection:text-white">
            <TopNav />
            <Sidebar />

            <main className="pl-96 pr-6 pt-28 pb-6 min-h-screen">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
