import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import ImageGenerator from './components/features/ImageGenerator';
import ImageEditor from './components/features/ImageEditor';
import Projects from './components/features/Projects';
import DesignersList from './components/features/DesignersList';
import UsageDashboard from './components/features/UsageDashboard';
import AuthModal from './components/auth/AuthModal';
import ProfileSettings from './components/features/ProfileSettings';
import TopNav from './components/layout/TopNav';
import Sidebar from './components/layout/Sidebar';
import { AuthService, User } from './services/auth';
import { ProjectsService, Project } from './services/projects';
import AccessRestricted from './components/ui/AccessRestricted';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<'generate' | 'edit' | 'projects' | 'team' | 'usage'>('generate');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [selectedModel, setSelectedModel] = useState('Grok 2');
    const [editingImage, setEditingImage] = useState<string | null>(null);

    // Load initial state
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) setCurrentUser(user);

        ProjectsService.getAll().then(setProjects);

        // Listen for auth modal events from AccessRestricted component
        const handleOpenAuth = () => setIsAuthModalOpen(true);
        window.addEventListener('open-auth-modal', handleOpenAuth);

        return () => {
            window.removeEventListener('open-auth-modal', handleOpenAuth);
        };
    }, []);

    const handleLogin = async (userData: { name: string; avatar: string }) => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        setIsAuthModalOpen(false);
    };

    const handleUpdateProfile = async (name: string, avatar: string): Promise<void> => {
        if (!currentUser) return;

        try {
            console.log('🔄 Updating profile...');
            const updatedUser = await AuthService.updateProfile(name, avatar);
            if (updatedUser) {
                setCurrentUser(updatedUser);
                console.log('✅ Profile updated! New avatar:', updatedUser.avatar);
                // Force a small delay to ensure state updates
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                console.error('❌ Failed to update profile');
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    };

    const handleGenerateRequest = async (prompt: string, aspectRatio: string, resolution?: string, referenceImage?: string, referenceImageMimeType?: string): Promise<Project | null> => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
            return null;
        }

        // Update status to "generating"
        await AuthService.updateStatus('generating');

        try {
            const newProject = await ProjectsService.create({
                imageUrl: '',
                prompt: prompt,
                author: currentUser.name,
                authorAvatar: currentUser.avatar,
                model: selectedModel,
                aspectRatio: aspectRatio,
                resolution: resolution,
                referenceImage: referenceImage,
                referenceImageMimeType: referenceImageMimeType
            });

            setProjects(prev => [newProject, ...prev]);
            // Don't redirect to projects view anymore
            // setCurrentView('projects');

            return newProject;
        } catch (error) {
            console.error('Error generating project:', error);
            return null;
        } finally {
            // Update status back to "online" after generating
            await AuthService.updateStatus('online');
        }
    };

    const handleEditImage = (imageUrl: string) => {
        setEditingImage(imageUrl);
        setCurrentView('edit');
    };

    return (
        <div className="min-h-screen w-full bg-background text-white selection:bg-brand selection:text-white">
            <TopNav
                key={currentUser?.avatar || 'no-user'}
                currentView={currentView}
                onNavigate={setCurrentView}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Only show Sidebar in Generate view */}
            {/* Only show Sidebar in Generate view and when logged in */}
            {currentView === 'generate' && currentUser && (
                <Sidebar selectedModel={selectedModel} onSelectModel={setSelectedModel} />
            )}

            {/* Adjusted padding: removed pl-96 since sidebar is now floating/compact */}
            <main className="max-w-7xl mx-auto pt-28 pb-6 px-6 min-h-screen relative">
                {currentView === 'generate' && (
                    <ImageGenerator
                        onGenerate={handleGenerateRequest}
                        isLoggedIn={!!currentUser}
                        onEditImage={handleEditImage}
                        selectedModel={selectedModel}
                    />
                )}
                {currentView === 'projects' && (
                    <Projects
                        projects={projects}
                        currentUser={currentUser ? currentUser.name : ''}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                        onEditImage={handleEditImage}
                    />
                )}
                {currentView === 'team' && (
                    currentUser ? (
                        <DesignersList
                            projects={projects}
                            currentUser={currentUser ? { name: currentUser.name, avatar: currentUser.avatar } : undefined}
                            onUpdateProfile={handleUpdateProfile}
                            onEditImage={handleEditImage}
                        />
                    ) : (
                        <AccessRestricted onSignIn={() => setIsAuthModalOpen(true)} />
                    )
                )}
                {currentView === 'usage' && (
                    currentUser ? (
                        <UsageDashboard />
                    ) : (
                        <AccessRestricted onSignIn={() => setIsAuthModalOpen(true)} />
                    )
                )}
                {currentView === 'edit' && (
                    currentUser ? (
                        <ImageEditor initialImage={editingImage} />
                    ) : (
                        <AccessRestricted onSignIn={() => setIsAuthModalOpen(true)} />
                    )
                )}
            </main>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleLogin}
            />

            {currentUser && (
                <ProfileSettings
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    currentUser={currentUser}
                    onUpdateProfile={handleUpdateProfile}
                    onLogout={() => {
                        AuthService.logout();
                        setCurrentUser(null);
                        setIsSettingsOpen(false);
                        setIsAuthModalOpen(true);
                    }}
                />
            )}
        </div>
    );
};

export default App;