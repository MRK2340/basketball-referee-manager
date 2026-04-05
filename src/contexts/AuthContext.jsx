import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { DEMO_MANAGER_BASE, DEMO_REFEREE_BASE } from '@/lib/demoAccounts';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const STORAGE_KEYS = {
    USERS: 'iwhistle_users',
    SESSION: 'iwhistle_session',
    TEMP_DATA: 'iwhistle_temp_data',
};

// Base64 encoding provides basic obfuscation to avoid accidental plaintext exposure in developer tools — not cryptographic security
const obfuscate = (str) => btoa(encodeURIComponent(str));

const getStoredUsers = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.USERS);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error parsing stored users:", error);
        return [];
    }
};

const setStoredUsers = (users) => {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
        console.error("Error saving users to storage:", error);
        toast({
            title: "Storage Error",
            description: "Failed to save user data. Local storage might be full.",
            variant: "destructive"
        });
    }
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
             const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
             if (storedSession) {
                 try {
                     const sessionUser = JSON.parse(storedSession);
                     const users = getStoredUsers();
                     const foundUser = users.find(u => u.id === sessionUser.id);

                     if (foundUser) {
                         const { password, ...userWithoutPassword } = foundUser;
                         setUser(userWithoutPassword);
                     } else {
                         localStorage.removeItem(STORAGE_KEYS.SESSION);
                     }
                 } catch (e) {
                     console.error("Session restoration error:", e);
                     localStorage.removeItem(STORAGE_KEYS.SESSION);
                 }
             }
             setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);

        try {
            const users = getStoredUsers();
            const obfuscatedPassword = obfuscate(password);
            // Check new encoding, legacy btoa encoding, and plaintext for backward compat
            const foundUser = users.find(u =>
                u.email.toLowerCase() === email.toLowerCase() &&
                (u.password === obfuscatedPassword || u.password === btoa(password) || u.password === password)
            );

            if (foundUser) {
                const { password: _, ...userWithoutPassword } = foundUser;
                setUser(userWithoutPassword);
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(userWithoutPassword));
                setLoading(false);
                return userWithoutPassword;
            }

            throw new Error("Invalid email or password.");
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const register = async (userData) => {
        setLoading(true);

        try {
            const users = getStoredUsers();
            if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                 setLoading(false);
                 toast({
                    title: "Registration failed",
                    description: "An account with this email already exists.",
                    variant: "destructive",
                });
                return { success: false, error: "User already exists" };
            }

            const newUser = {
                id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                ...userData,
                password: obfuscate(userData.password),
                role: userData.role || 'referee',
                created_at: new Date().toISOString(),
                avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
            };

            const updatedUsers = [...users, newUser];
            setStoredUsers(updatedUsers);

            toast({
                title: "Account created! 🎉",
                description: "You can now log in with your new account.",
            });
            return { success: true };
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setUser(null);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        localStorage.removeItem(STORAGE_KEYS.TEMP_DATA);
        toast({
            title: "Logged out",
            description: "See you next time! 👋",
        });
        setLoading(false);
    };

    const updateProfile = async (updates) => {
        if (!user) return;
        setLoading(true);

        try {
            const users = getStoredUsers();
            const updatedUsers = users.map(u => {
                if (u.id === user.id) {
                    if (updates.password) {
                        return { ...u, ...updates, password: obfuscate(updates.password) };
                    }
                    return { ...u, ...updates };
                }
                return u;
            });

            setStoredUsers(updatedUsers);

            const updatedUser = updatedUsers.find(u => u.id === user.id);
            const { password: _, ...userWithoutPassword } = updatedUser;

            setUser(userWithoutPassword);
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(userWithoutPassword));

            toast({
                title: "Profile updated! ✅",
                description: "Your changes have been saved.",
            });
        } catch (error) {
            console.error("Update profile error:", error);
            toast({
                title: "Update failed",
                description: "Could not save profile changes.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const uploadAvatar = async (file) => {
        if (!user) return;
        if (file.size > 1_000_000) {
            toast({
                title: "Image too large",
                description: "Please upload a photo under 1 MB.",
                variant: "destructive",
            });
            return;
        }
        setLoading(true);
        try {
            const avatarUrl = await readFileAsDataUrl(file);
            const users = getStoredUsers();
            const updatedUsers = users.map(u => u.id === user.id ? { ...u, avatar_url: avatarUrl } : u);
            setStoredUsers(updatedUsers);
            const updatedUser = { ...user, avatar_url: avatarUrl };
            setUser(updatedUser);
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
            toast({ title: "Profile photo updated! ✅", description: "Your new photo has been saved." });
        } catch (error) {
            toast({
                title: "Upload failed",
                description: error.message || "Could not update your profile photo.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const createDemoAccounts = async () => {
        try {
            const users = getStoredUsers();

            const demoAccounts = [
                { ...DEMO_MANAGER_BASE, password: obfuscate('password') },
                { ...DEMO_REFEREE_BASE, password: obfuscate('password') },
            ];

            let newUsers = [...users];
            let added = false;

            demoAccounts.forEach(demoAcct => {
                if (!users.find(u => u.email === demoAcct.email)) {
                    newUsers.push(demoAcct);
                    added = true;
                }
            });

            if (added) {
                setStoredUsers(newUsers);
            }

            return { success: true };
        } catch (error) {
            console.error("Create demo accounts error:", error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        loading,
        createDemoAccounts,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
